import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Loader2, Mail, ShieldCheck } from "lucide-react";
import { effectiveAge } from "@/lib/age";
import { toast } from "sonner";


type Filter = "all" | "adult" | "minor" | "missing";

type Row = {
  athlete_id: string;
  display_name: string;
  age: number | null;
  status: "granted" | "withdrawn" | "missing" | "pending";
  granted_at: string | null;
  withdrawn_at: string | null;
  granted_by_email: string | null;
  granted_by_relation: "self" | "parent" | null;
  policy_version: string | null;
  is_minor: boolean;
  parent_email_on_token: string | null;
};


function fmtDate(iso: string | null, locale: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function CoachConsents() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const { activeClubId, activeMembership } = useActiveClub();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const clubName = (activeMembership as any)?.club?.name || (activeMembership as any)?.clubs?.name || "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeClubId) { setLoading(false); return; }
      setLoading(true);

      // Members of the club (athletes)
      const { data: members } = await supabase.rpc("get_club_member_profiles", { _club_id: activeClubId });
      const memberList = (members || []).filter((m: any) => !m.is_coach);

      // Consent records for the club
      const { data: consents } = await supabase
        .from("consent_records")
        .select("athlete_id,status,granted_at,withdrawn_at,granted_by_email,granted_by_relation,policy_version")
        .eq("club_id", activeClubId)
        .eq("consent_type", "health_data_processing");

      const byId = new Map<string, any>();
      (consents || []).forEach((c: any) => byId.set(c.athlete_id, c));

      const out: Row[] = memberList.map((m: any) => {
        const c = byId.get(m.user_id);
        const age = effectiveAge(m.birth_date ?? null, m.age ?? null);
        const isMinor = age != null && age < 18;
        let status: Row["status"] = "missing";
        if (c) {
          if (c.status === "granted") status = "granted";
          else if (c.status === "withdrawn") status = "withdrawn";
          else status = "pending";
        }
        return {
          athlete_id: m.user_id,
          display_name: m.display_name || "—",
          age,
          status,
          granted_at: c?.granted_at ?? null,
          withdrawn_at: c?.withdrawn_at ?? null,
          granted_by_email: c?.granted_by_email ?? null,
          granted_by_relation: c?.granted_by_relation ?? null,
          policy_version: c?.policy_version ?? null,
          is_minor: isMinor,
        };
      });

      out.sort((a, b) => a.display_name.localeCompare(b.display_name));
      if (!cancelled) { setRows(out); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [activeClubId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "adult" && r.is_minor) return false;
      if (filter === "minor" && !r.is_minor) return false;
      if (filter === "missing" && r.status !== "missing") return false;
      if (q && !r.display_name.toLowerCase().includes(q) &&
              !(r.granted_by_email || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, search]);

  const counts = useMemo(() => ({
    granted: rows.filter(r => r.status === "granted").length,
    withdrawn: rows.filter(r => r.status === "withdrawn").length,
    missing: rows.filter(r => r.status === "missing" || r.status === "pending").length,
  }), [rows]);

  const exportCsv = () => {
    const headers = [
      t("consentsColAthlete"), t("consentsColType"),
      t("consentsColApprover"), t("consentsColRelation"),
      t("consentsColDate"), t("consentsColStatus"), t("consentsColPolicy"),
    ];
    const lines = [headers.join(",")];
    const esc = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
    filtered.forEach((r) => {
      lines.push([
        esc(r.display_name + (r.age != null ? ` (${r.age})` : "")),
        esc(r.is_minor ? t("consentsTypeParent") : t("consentsTypeAdult")),
        esc(r.granted_by_email || ""),
        esc(r.granted_by_relation === "self" ? t("consentsRelationSelf")
              : r.granted_by_relation === "parent" ? t("consentsRelationParent") : ""),
        esc(fmtDate(r.granted_at, locale)),
        esc(
          r.status === "granted" ? t("consentsStatusGranted")
          : r.status === "withdrawn" ? t("consentsStatusWithdrawn")
          : t("consentsStatusMissing")
        ),
        esc(r.policy_version || ""),
      ].join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consents-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ s }: { s: Row["status"] }) => {
    if (s === "granted") return <Badge className="bg-green-600 hover:bg-green-600">{t("consentsStatusGranted")}</Badge>;
    if (s === "withdrawn") return <Badge variant="secondary">{t("consentsStatusWithdrawn")}</Badge>;
    return <Badge variant="destructive">{t("consentsStatusMissing")}</Badge>;
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/coach")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("back")}
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t("consentsPageTitle")}
              </h1>
              {clubName && <div className="text-xs text-muted-foreground">{clubName}</div>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || filtered.length === 0}>
            <Download className="h-4 w-4 mr-1" /> {t("consentsExportCsv")}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{t("consentsStatusGranted")}</div>
            <div className="text-2xl font-semibold text-green-600">{counts.granted}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{t("consentsStatusMissing")}</div>
            <div className="text-2xl font-semibold text-destructive">{counts.missing}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">{t("consentsStatusWithdrawn")}</div>
            <div className="text-2xl font-semibold">{counts.withdrawn}</div>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "adult", "minor", "missing"] as Filter[]).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {t(`consentsFilter_${f}` as any)}
            </Button>
          ))}
          <Input
            className="max-w-xs ml-auto"
            placeholder={t("consentsSearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          {loading ? (
            <div className="p-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t("loading")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("consentsEmpty")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("consentsColAthlete")}</TableHead>
                  <TableHead>{t("consentsColType")}</TableHead>
                  <TableHead>{t("consentsColApprover")}</TableHead>
                  <TableHead>{t("consentsColDate")}</TableHead>
                  <TableHead>{t("consentsColStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.athlete_id}>
                    <TableCell className="font-medium">
                      {r.display_name}
                      {r.age != null && r.is_minor && (
                        <span className="text-muted-foreground ml-1">({r.age})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.is_minor ? t("consentsTypeParent") : t("consentsTypeAdult")}
                    </TableCell>
                    <TableCell>
                      {r.granted_by_email ? (
                        <div className="flex flex-col">
                          <span>{r.granted_by_email}</span>
                          <span className="text-xs text-muted-foreground">
                            {r.granted_by_relation === "self"
                              ? t("consentsRelationSelf")
                              : r.granted_by_relation === "parent"
                                ? t("consentsRelationParent") : ""}
                          </span>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell title={r.policy_version ? `${t("consentPolicyVersion")}: ${r.policy_version}` : undefined}>
                      {fmtDate(r.granted_at, locale)}
                    </TableCell>
                    <TableCell><StatusBadge s={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
