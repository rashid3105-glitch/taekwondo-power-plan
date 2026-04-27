import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowUp, ArrowDown, Minus, Watch } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Summary {
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  steps: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}

/**
 * Compact recovery tile shown on the Dashboard hub for athletes who own a
 * wearable. Pulls yesterday's `wearable_daily_summary` row and shows trend
 * arrows vs the rolling 7-day baseline. Hidden when no data exists yet.
 */
export function RecoveryTile() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }
      const yday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("wearable_daily_summary")
        .select("sleep_minutes,resting_hr,hrv_rmssd,steps,baseline_hr_7d,baseline_hrv_7d")
        .eq("user_id", user.id)
        .eq("summary_date", yday)
        .maybeSingle();
      setSummary(data as Summary | null);
      setLoaded(true);
    })();
  }, []);

  if (!loaded || !summary) return null;

  const sleepH = summary.sleep_minutes ? (summary.sleep_minutes / 60).toFixed(1) : "—";
  const trend = (val: number | null, base: number | null, lowerIsBetter = false) => {
    if (val == null || base == null) return <Minus className="h-3 w-3 text-muted-foreground" />;
    const diff = val - base;
    const good = lowerIsBetter ? diff < -1 : diff > 1;
    const bad = lowerIsBetter ? diff > 1 : diff < -1;
    if (good) return <ArrowUp className="h-3 w-3 text-emerald-500" />;
    if (bad) return <ArrowDown className="h-3 w-3 text-rose-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Link to="/wearables" className="block">
      <Card className="border-2 border-primary/30 hover:border-primary/60 transition-colors">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{t("recoveryTileTitle")}</span>
            <Watch className="h-3 w-3 text-muted-foreground ml-auto" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">{sleepH}<span className="text-xs text-muted-foreground">h</span></div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("recoverySleep")}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                {summary.resting_hr ? Math.round(summary.resting_hr) : "—"}
                {trend(summary.resting_hr, summary.baseline_hr_7d, true)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("recoveryRhr")}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                {summary.hrv_rmssd ? Math.round(summary.hrv_rmssd) : "—"}
                {trend(summary.hrv_rmssd, summary.baseline_hrv_7d, false)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">HRV</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
