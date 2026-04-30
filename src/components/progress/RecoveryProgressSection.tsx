import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, Watch, Footprints, Heart, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface SummaryRow {
  summary_date: string;
  steps: number | null;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
}

interface WorkoutSample {
  id: string;
  start_at: string;
  value_numeric: number | null;
  payload: any;
}

/**
 * "Recovery & Wearables" widget on the Progress page.
 * Shows Steps + Workouts (always available) plus Sleep / RHR / HRV when
 * they're present in the daily summary (pulled via capacitor-health on iOS
 * and Android Health Connect).
 */
export function RecoveryProgressSection() {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const [ownsWearable, setOwnsWearable] = useState(false);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSample[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
      const since14 = new Date(Date.now() - 14 * 86400_000).toISOString();

      const [{ data: summaries }, { data: ws }] = await Promise.all([
        supabase.from("wearable_daily_summary")
          .select("summary_date,steps,sleep_minutes,resting_hr,hrv_rmssd")
          .eq("user_id", user.id)
          .gte("summary_date", since)
          .order("summary_date", { ascending: true }),
        supabase.from("wearable_samples")
          .select("id,start_at,value_numeric,payload")
          .eq("user_id", user.id)
          .eq("metric_type", "workout")
          .gte("start_at", since14)
          .order("start_at", { ascending: false })
          .limit(40),
      ]);
      setRows((summaries ?? []) as SummaryRow[]);
      setWorkouts((ws ?? []) as WorkoutSample[]);
      setLoaded(true);
    })();
  }, []);

  const stepData = useMemo(() => rows.map(r => ({
    date: r.summary_date.slice(5),
    steps: r.steps ?? 0,
  })), [rows]);

  const stepsTotals = useMemo(() => {
    const last7 = rows.slice(-7).map(r => r.steps ?? 0);
    const today = last7[last7.length - 1] ?? 0;
    const avg7 = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
    return { today, avg7 };
  }, [rows]);

  const woTotals = useMemo(() => {
    if (!workouts.length) return null;
    let mins = 0, hrSum = 0, hrCount = 0;
    for (const w of workouts) {
      const p = w.payload || {};
      mins += Number(p.duration_minutes ?? w.value_numeric ?? 0);
      if (typeof p.avg_hr === "number") { hrSum += p.avg_hr; hrCount += 1; }
    }
    return {
      count: workouts.length,
      mins: Math.round(mins),
      avgHr: hrCount ? Math.round(hrSum / hrCount) : null,
    };
  }, [workouts]);

  const hasAnyData = rows.some(r => (r.steps ?? 0) > 0) || workouts.length > 0;

  if (!loaded) return null;
  if (!ownsWearable) return null;

  if (!hasAnyData) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("recoveryProgressTitle")}</h3>
          <Watch className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("recoveryCollectingData")}{" "}
          <Link to="/wearables/sync" className="text-primary underline">{t("recoveryOpenSync")}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{t("recoveryProgressTitle")}</h3>
        <Link to="/health" className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
          {t("healthOpenDetails" as any) || "Open Health"} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat icon={<Footprints className="h-3.5 w-3.5" />} label={t("healthStepsToday" as any) || "Steps today"} value={stepsTotals.today.toLocaleString()} />
        <Stat icon={<Footprints className="h-3.5 w-3.5" />} label={t("healthStepsAvg7" as any) || "7-day avg"} value={stepsTotals.avg7.toLocaleString()} />
        <Stat icon={<Heart className="h-3.5 w-3.5" />} label={t("healthWoCount" as any) || "Sessions"} value={woTotals?.count ?? 0} />
        <Stat icon={<Heart className="h-3.5 w-3.5" />} label={t("healthWoAvgHr" as any) || "Avg HR"} value={woTotals?.avgHr ?? "—"} />
      </div>

      {/* Steps chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-foreground">{t("healthStepsTitle" as any) || "Steps"} · 30d</h4>
          <span className="text-[10px] text-muted-foreground">{t("recoveryLast30d")}</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stepData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
              <Bar dataKey="steps" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        {icon}{label}
      </div>
      <div className="text-base font-bold text-foreground">{value}</div>
    </div>
  );
}
