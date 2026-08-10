import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Row {
  athlete: string;
  fieldName: string;
  value: string | null;
  expiresAt: string | null;
}

type Status = "expired" | "soon" | "valid" | "missing";

function statusOf(row: Row): Status {
  if (!row.expiresAt && !row.value) return "missing";
  if (!row.expiresAt) return "valid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(row.expiresAt);
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "soon";
  return "valid";
}

const STATUS_CLASS: Record<Status, string> = {
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  soon: "bg-primary/15 text-primary border-primary/30",
  valid: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  missing: "bg-muted text-muted-foreground border-border",
};

export function LicenseReport() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: me } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const clubId = (me as any)?.club_id as string | null;

      const [fieldsRes, profilesRes] = await Promise.all([
        supabase.from("coach_license_fields").select("id, field_name, sort_order").order("sort_order"),
        clubId
          ? supabase
              .from("profiles")
              .select(
                "user_id, display_name, license_values, gal_license, gal_license_expires_at, has_myfightbook, myfightbook_expires_at, antidoping_course_date",
              )
              .eq("club_id", clubId)
              .neq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const fields = ((fieldsRes.data as any[]) || []) as { id: string; field_name: string }[];
      const profiles = ((profilesRes as any).data as any[]) || [];

      const addYear = (d: string) => {
        const dt = new Date(d);
        dt.setFullYear(dt.getFullYear() + 1);
        return dt.toISOString().slice(0, 10);
      };

      const out: Row[] = [];
      for (const p of profiles.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""))) {
        const name = p.display_name || "—";

        // Standard license fields (stored as dedicated profile columns)
        out.push({
          athlete: name,
          fieldName: t("galLicense") || "GAL license",
          value: p.gal_license || null,
          expiresAt: p.gal_license_expires_at || null,
        });
        out.push({
          athlete: name,
          fieldName: t("hasMyFightBook") || "MyFightBook",
          value: p.has_myfightbook ? (t("yes") || "Yes") : null,
          expiresAt: p.myfightbook_expires_at || null,
        });
        out.push({
          athlete: name,
          fieldName: t("antidopingCourseDate") || "Antidoping course",
          value: p.antidoping_course_date || null,
          expiresAt: p.antidoping_course_date ? addYear(p.antidoping_course_date) : null,
        });

        // Custom club license fields — only rows that actually hold data
        const values = (p.license_values || {}) as Record<string, { value?: string | null; expires_at?: string | null }>;
        for (const f of fields) {
          const v = values[f.id] || {};
          if (!v.value && !v.expires_at) continue;
          out.push({
            athlete: name,
            fieldName: f.field_name,
            value: v.value ?? null,
            expiresAt: v.expires_at ?? null,
          });
        }
      }
      setRows(out);
      setLoading(false);
    })();
  }, []);

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.fieldName))),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (typeFilter === "all" ? true : r.fieldName === typeFilter))
      .filter((r) => (statusFilter === "all" ? true : statusOf(r) === statusFilter))
      .sort((a, b) => {
        const ax = a.expiresAt || "9999-12-31";
        const bx = b.expiresAt || "9999-12-31";
        if (ax !== bx) return ax.localeCompare(bx);
        return a.athlete.localeCompare(b.athlete);
      });
  }, [rows, statusFilter, typeFilter]);

  const exportCsv = () => {
    const header = [t("licenseReportAthlete"), t("licenseReportType"), t("licenseReportValue"), t("licenseReportExpiry"), t("licenseReportStatus")];
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const body = filtered.map((r) =>
      [r.athlete, r.fieldName, r.value || "", r.expiresAt || "", t(`licenseStatus${statusOf(r).charAt(0).toUpperCase()}${statusOf(r).slice(1)}` as any)]
        .map(esc)
        .join(","),
    );
    const csv = [header.map(esc).join(","), ...body].join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">{t("licenseReportEmpty")}</p>;
  }

  const statusFilters: (Status | "all")[] = ["all", "expired", "soon", "valid", "missing"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            data-active={statusFilter === s}
            className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
              data-[active=true]:bg-foreground data-[active=true]:text-background
              data-[active=false]:text-muted-foreground hover:text-foreground"
          >
            {s === "all"
              ? t("allFilter")
              : t(`licenseStatus${s.charAt(0).toUpperCase()}${s.slice(1)}` as any)}
          </button>
        ))}
        {types.length > 1 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            <option value="all">{t("licenseReportType")}: {t("allFilter")}</option>
            {types.map((ty) => (
              <option key={ty} value={ty}>{ty}</option>
            ))}
          </select>
        )}
        <Button size="sm" variant="outline" className="ml-auto" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1.5" />
          {t("licenseReportExport")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-foreground">{t("licenseReportAthlete")}</th>
              <th className="px-3 py-2 font-semibold text-foreground">{t("licenseReportType")}</th>
              <th className="px-3 py-2 font-semibold text-foreground">{t("licenseReportValue")}</th>
              <th className="px-3 py-2 font-semibold text-foreground">{t("licenseReportExpiry")}</th>
              <th className="px-3 py-2 font-semibold text-foreground">{t("licenseReportStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = statusOf(r);
              return (
                <tr key={`${r.athlete}-${r.fieldName}-${i}`} className="border-t border-border/60">
                  <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{r.athlete}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{r.fieldName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.value || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {r.expiresAt || t("licenseReportNoDate")}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold", STATUS_CLASS[st])}>
                      {t(`licenseStatus${st.charAt(0).toUpperCase()}${st.slice(1)}` as any)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
