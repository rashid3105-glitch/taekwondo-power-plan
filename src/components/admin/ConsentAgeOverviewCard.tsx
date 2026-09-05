import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface Row {
  club_id: string;
  club_name: string | null;
  club_country: string | null;
  applicable_age: number | null;
  athletes: number;
  missing_birth_date: number;
  requires_guardian: number;
}

/**
 * Admin overview: applicable digital-consent age per club (GDPR Art. 8)
 * and how many athletes actually require guardian consent under it.
 */
export function ConsentAgeOverviewCard() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("admin_consent_age_overview");
      if (cancelled) return;
      if (error) {
        console.error("[ConsentAgeOverviewCard] load failed:", error.message);
        setRows([]);
      } else {
        setRows((data as any[]) as Row[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">{t("consentAgeOverviewTitle")}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{t("consentAgeOverviewDesc")}</p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">—</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-3 font-medium">{t("consentAgeClub")}</th>
                <th className="py-1 pr-3 font-medium">{t("consentAgeLimit")}</th>
                <th className="py-1 pr-3 font-medium">{t("consentAgeAthletes")}</th>
                <th className="py-1 pr-3 font-medium">{t("consentAgeGuardian")}</th>
                <th className="py-1 font-medium">{t("consentAgeMissingBd")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.club_id} className="border-t border-border/60">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{r.club_name || "—"}</span>
                    {r.club_country && (
                      <span className="text-xs text-muted-foreground ml-1">({r.club_country})</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant="secondary">{r.applicable_age ?? "—"}</Badge>
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{r.athletes}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.requires_guardian}</td>
                  <td className="py-2 tabular-nums">{r.missing_birth_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
