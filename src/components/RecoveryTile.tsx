import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowUp, ArrowDown, Minus, Watch, Footprints, Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Summary {
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  steps: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}

interface WorkoutSample {
  start_at: string;
  payload: any;
  value_numeric: number | null;
}

/**
 * Compact recovery tile shown on the Dashboard hub for athletes who own a
 * wearable. Prefers Sleep/RHR/HRV when available (pulled from Apple Health
 * / Health Connect), otherwise falls back to Steps + last workout.
 */
export function RecoveryTile() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastWorkout, setLastWorkout] = useState<WorkoutSample | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }
      const yday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      const since3 = new Date(Date.now() - 3 * 86400_000).toISOString();

      const [{ data: sum }, { data: todaySum }, { data: ws }] = await Promise.all([
        supabase
          .from("wearable_daily_summary")
          .select("sleep_minutes,resting_hr,hrv_rmssd,steps,baseline_hr_7d,baseline_hrv_7d")
          .eq("user_id", user.id)
          .eq("summary_date", yday)
          .maybeSingle(),
        supabase
          .from("wearable_daily_summary")
          .select("steps")
          .eq("user_id", user.id)
          .eq("summary_date", today)
          .maybeSingle(),
        supabase
          .from("wearable_samples")
          .select("start_at,payload,value_numeric")
          .eq("user_id", user.id)
          .eq("metric_type", "workout")
          .gte("start_at", since3)
          .order("start_at", { ascending: false })
          .limit(1),
      ]);

      const merged: Summary = {
        sleep_minutes: (sum as any)?.sleep_minutes ?? null,
        resting_hr: (sum as any)?.resting_hr ?? null,
        hrv_rmssd: (sum as any)?.hrv_rmssd ?? null,
        steps: ((todaySum as any)?.steps ?? (sum as any)?.steps) ?? null,
        baseline_hr_7d: (sum as any)?.baseline_hr_7d ?? null,
        baseline_hrv_7d: (sum as any)?.baseline_hrv_7d ?? null,
      };
      setSummary(merged);
      setLastWorkout((ws && ws[0]) ? (ws[0] as WorkoutSample) : null);
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return null;
  if (!summary && !lastWorkout) return null;

  const hasRecovery = !!(summary && (summary.sleep_minutes || summary.resting_hr || summary.hrv_rmssd));
  const trend = (val: number | null, base: number | null, lowerIsBetter = false) => {
    if (val == null || base == null) return <Minus className="h-3 w-3 text-muted-foreground" />;
    const diff = val - base;
    const good = lowerIsBetter ? diff < -1 : diff > 1;
    const bad = lowerIsBetter ? diff > 1 : diff < -1;
    if (good) return <ArrowUp className="h-3 w-3 text-emerald-500" />;
    if (bad) return <ArrowDown className="h-3 w-3 text-rose-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  // Recovery view (Sleep / RHR / HRV) when any of those are present
  if (hasRecovery && summary) {
    const sleepH = summary.sleep_minutes ? (summary.sleep_minutes / 60).toFixed(1) : "—";
    return (
      <Link to="/health" className="block">
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

  // Fallback view: Steps + last workout
  const steps = summary?.steps ?? null;
  const wp = lastWorkout?.payload || {};
  const lastDur = lastWorkout ? Math.round(Number(wp.duration_minutes ?? lastWorkout.value_numeric ?? 0)) : null;
  const lastHr = typeof wp.avg_hr === "number" ? wp.avg_hr : null;

  return (
    <Link to="/health" className="block">
      <Card className="border-2 border-primary/30 hover:border-primary/60 transition-colors">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">{t("recoveryTileTitle")}</span>
            <Watch className="h-3 w-3 text-muted-foreground ml-auto" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                <Footprints className="h-3.5 w-3.5 text-muted-foreground" />
                {steps != null ? steps.toLocaleString() : "—"}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Steps</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                {lastDur != null ? `${lastDur}m` : "—"}
                {lastHr ? <span className="text-xs text-muted-foreground">· {lastHr}</span> : null}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Last workout</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
