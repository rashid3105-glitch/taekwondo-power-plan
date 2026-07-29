import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";

interface AlertRow {
  id: string;
  athlete_id: string;
  alert_type: "gal_license" | "myfightbook" | "antidoping";
  severity: "warning" | "expired" | "missing";
  due_date: string | null;
}

/**
 * Shows unread compliance alerts (GAL license, MyFightBook, anti-doping course)
 * for the signed-in user — as athlete (own data) or coach (their athletes).
 */
export function ComplianceAlertsCard() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      const { data } = await supabase
        .from("compliance_alerts")
        .select("id, athlete_id, alert_type, severity, due_date")
        .eq("recipient_id", uid)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!active || !data) return;
      setAlerts(data as AlertRow[]);

      const otherIds = Array.from(
        new Set(data.map((a: any) => a.athlete_id).filter((id: string) => id !== uid)),
      );
      if (otherIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", otherIds);
        if (active && profiles) {
          const map: Record<string, string> = {};
          for (const p of profiles as any[]) map[p.user_id] = p.display_name || "";
          setNames(map);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const dismiss = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("compliance_alerts").update({ is_read: true }).eq("id", id);
  };

  if (alerts.length === 0) return null;

  const labelFor = (type: AlertRow["alert_type"]) =>
    type === "gal_license" ? t("complianceGal")
      : type === "myfightbook" ? t("complianceMfb")
        : t("complianceAnti");

  const statusFor = (a: AlertRow) => {
    if (a.severity === "missing") return t("complianceMissing");
    if (a.severity === "expired") return `${t("complianceExpired")}${a.due_date ? ` · ${a.due_date}` : ""}`;
    return `${t("complianceExpiringSoon")}${a.due_date ? ` · ${t("complianceExpiresOn")} ${a.due_date}` : ""}`;
  };

  return (
    <section className="rounded-2xl border border-[#c9a84c]/30 bg-[#141414] p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-[#c9a84c]" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#c9a84c] font-['Manrope']">
          {t("complianceAlertsTitle")}
        </h2>
      </div>
      <ul className="space-y-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-xl bg-[#0f0f0f] border border-white/10 px-3 py-2.5"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle
                className={`h-4 w-4 mt-0.5 shrink-0 ${a.severity === "warning" ? "text-amber-400" : "text-red-400"}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {labelFor(a.alert_type)}
                  {names[a.athlete_id] ? ` · ${names[a.athlete_id]}` : ""}
                </p>
                <p className="text-xs text-white/70">{statusFor(a)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(a.id)}
              title={t("complianceDismiss")}
              aria-label={t("complianceDismiss")}
              className="text-white/50 hover:text-white transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ComplianceAlertsCard;
