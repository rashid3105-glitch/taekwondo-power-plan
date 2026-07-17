import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface Summary {
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
}

export function HubRecoveryStrip() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }
      const since = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("wearable_daily_summary")
        .select("summary_date,sleep_minutes,resting_hr,hrv_rmssd")
        .eq("user_id", user.id)
        .gte("summary_date", since)
        .order("summary_date", { ascending: false })
        .limit(7);
      const row = (data ?? []).find((r: any) =>
        r.sleep_minutes != null || r.resting_hr != null || r.hrv_rmssd != null
      );
      setSummary({
        sleep_minutes: (row as any)?.sleep_minutes ?? null,
        resting_hr: (row as any)?.resting_hr ?? null,
        hrv_rmssd: (row as any)?.hrv_rmssd ?? null,
      });
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return null;

  const fmt = (v: number | null, round = true) =>
    v == null ? "—" : round ? String(Math.round(v)) : v.toFixed(1);
  const sleep = summary?.sleep_minutes ? (summary.sleep_minutes / 60).toFixed(1) : "—";

  const cells = [
    { value: fmt(summary?.resting_hr ?? null), label: t("recoveryRhr"), color: "text-tab-progress" },
    { value: fmt(summary?.hrv_rmssd ?? null), label: "HRV", color: "text-tab-mental" },
    { value: sleep, label: t("recoverySleep"), color: "text-card-foreground" },
  ];

  return (
    <Link
      to="/health"
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 shadow-card transition-all hover:border-primary/30"
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <Activity className="h-4 w-4 text-emerald-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("recoveryTileTitle")}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-4 sm:gap-6">
        {cells.map((c, i) => (
          <div key={i} className="flex items-baseline gap-1.5">
            <span className={`text-xl font-extrabold leading-none ${c.color}`}>{c.value}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
