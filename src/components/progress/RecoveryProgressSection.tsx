import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowDown, ArrowUp, Minus, Watch, AlertTriangle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

type Metric = "sleep" | "rhr" | "hrv";

interface SummaryRow {
  summary_date: string;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  steps: number | null;
}

/**
 * Recovery & Wearables block on the Progress page. Hidden when the athlete
 * doesn't own a wearable or hasn't synced enough data yet.
 *
 * Shows:
 *  - 30d trend chart (toggle Sleep / RHR / HRV)
 *  - Last 7d vs prior 7d deltas with low-recovery flag
 *  - Weekly training minutes overlay vs avg HRV (load-vs-recovery)
 */
export function RecoveryProgressSection() {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const [ownsWearable, setOwnsWearable] = useState(false);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState<{ week: string; minutes: number }[]>([]);
  const [metric, setMetric] = useState<Metric>("sleep");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("owns_wearable")
        .eq("user_id", user.id)
        .maybeSingle();
      const owns = !!(prof as any)?.owns_wearable;
      setOwnsWearable(owns);

      if (!owns) { setLoaded(true); return; }

      const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
      const { data: summaries } = await supabase
        .from("wearable_daily_summary")
        .select("summary_date,sleep_minutes,resting_hr,hrv_rmssd,steps")
        .eq("user_id", user.id)
        .gte("summary_date", since)
        .order("summary_date", { ascending: true });
      setRows((summaries ?? []) as SummaryRow[]);

      // Weekly training minutes from logged workouts that have a wearable match.
      const sinceISO = new Date(Date.now() - 28 * 86400_000).toISOString().slice(0, 10);
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("logged_date,duration_minutes")
        .eq("user_id", user.id)
        .gte("logged_date", sinceISO)
        .not("duration_minutes", "is", null);
      const buckets = new Map<string, number>();
      for (const l of (logs ?? []) as any[]) {
        const d = new Date(l.logged_date);
        const dow = (d.getUTCDay() + 6) % 7; // Monday-start
        d.setUTCDate(d.getUTCDate() - dow);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, (buckets.get(key) ?? 0) + (l.duration_minutes || 0));
      }
      setWeeklyMinutes(
        Array.from(buckets.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, minutes]) => ({ week: week.slice(5), minutes })),
      );

      setLoaded(true);
    })();
  }, []);

  const trendData = useMemo(() => rows.map(r => ({
    date: r.summary_date.slice(5),
    sleep: r.sleep_minutes != null ? +(r.sleep_minutes / 60).toFixed(2) : null,
    rhr: r.resting_hr,
    hrv: r.hrv_rmssd,
  })), [rows]);

  const overlayData = useMemo(() => {
    // Group HRV by ISO week (Mon-start) and pair with weeklyMinutes.
    const hrvByWeek = new Map<string, { sum: number; n: number }>();
    for (const r of rows) {
      if (r.hrv_rmssd == null) continue;
      const d = new Date(r.summary_date);
      const dow = (d.getUTCDay() + 6) % 7;
      d.setUTCDate(d.getUTCDate() - dow);
      const key = d.toISOString().slice(5, 10);
      const cur = hrvByWeek.get(key) ?? { sum: 0, n: 0 };
      cur.sum += r.hrv_rmssd; cur.n += 1;
      hrvByWeek.set(key, cur);
    }
    return weeklyMinutes.map(w => {
      const h = hrvByWeek.get(w.week);
      return { week: w.week, minutes: w.minutes, avgHrv: h ? +(h.sum / h.n).toFixed(1) : null };
    });
  }, [rows, weeklyMinutes]);

  const deltas = useMemo(() => {
    if (rows.length < 7) return null;
    const last7 = rows.slice(-7);
    const prev7 = rows.slice(-14, -7);
    const avg = (arr: SummaryRow[], pick: (r: SummaryRow) => number | null) => {
      const xs = arr.map(pick).filter((v): v is number => v != null);
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };
    return {
      sleep: { now: avg(last7, r => r.sleep_minutes ? r.sleep_minutes / 60 : null), prev: avg(prev7, r => r.sleep_minutes ? r.sleep_minutes / 60 : null) },
      rhr:   { now: avg(last7, r => r.resting_hr), prev: avg(prev7, r => r.resting_hr) },
      hrv:   { now: avg(last7, r => r.hrv_rmssd),  prev: avg(prev7, r => r.hrv_rmssd) },
    };
  }, [rows]);

  const lowRecovery = !!deltas && (
    (deltas.rhr.now != null && deltas.rhr.prev != null && deltas.rhr.now - deltas.rhr.prev > 5) ||
    (deltas.hrv.now != null && deltas.hrv.prev != null && deltas.hrv.prev - deltas.hrv.now > 8)
  );

  if (!loaded) return null;
  if (!ownsWearable) return null;

  // Connected but not enough data
  if (rows.length < 3) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("recoveryProgressTitle")}</h3>
          <Watch className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("recoveryCollectingData")}{" "}
          <Link to="/wearables-sync" className="text-primary underline">{t("recoveryOpenSync")}</Link>
        </p>
      </div>
    );
  }

  const metricCfg: Record<Metric, { label: string; color: string; unit: string; key: "sleep" | "rhr" | "hrv" }> = {
    sleep: { label: t("recoverySleep"),  color: "hsl(190, 95%, 50%)", unit: "h",   key: "sleep" },
    rhr:   { label: t("recoveryRhr"),    color: "hsl(0, 70%, 55%)",   unit: " bpm", key: "rhr" },
    hrv:   { label: "HRV",               color: "hsl(160, 80%, 45%)", unit: " ms", key: "hrv" },
  };
  const m = metricCfg[metric];

  const Delta = ({ now, prev, lowerIsBetter = false, unit = "" }: { now: number | null; prev: number | null; lowerIsBetter?: boolean; unit?: string }) => {
    if (now == null) return <span className="text-muted-foreground">—</span>;
    if (prev == null) return <span className="font-bold text-foreground">{now.toFixed(unit === "h" ? 1 : 0)}{unit}</span>;
    const diff = now - prev;
    const good = lowerIsBetter ? diff < -0.5 : diff > 0.5;
    const bad = lowerIsBetter ? diff > 0.5 : diff < -0.5;
    const Icon = good ? ArrowUp : bad ? ArrowDown : Minus;
    const color = good ? "text-emerald-500" : bad ? "text-rose-500" : "text-muted-foreground";
    return (
      <span className="inline-flex items-center gap-1">
        <span className="font-bold text-foreground">{now.toFixed(unit === "h" ? 1 : 0)}{unit}</span>
        <Icon className={`h-3 w-3 ${color}`} />
        <span className={`text-[10px] ${color}`}>{diff > 0 ? "+" : ""}{diff.toFixed(unit === "h" ? 1 : 0)}</span>
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{t("recoveryProgressTitle")}</h3>
        <Watch className="h-4 w-4 text-muted-foreground ml-auto" />
      </div>

      {lowRecovery && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded p-2">
          <AlertTriangle className="h-3.5 w-3.5" /> {t("coachRecoveryLowFlag")}
        </div>
      )}

      {/* Weekly averages strip */}
      {deltas && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t("recoverySleep")} · 7d</div>
            <div className="text-base"><Delta now={deltas.sleep.now} prev={deltas.sleep.prev} unit="h" /></div>
          </div>
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t("recoveryRhr")} · 7d</div>
            <div className="text-base"><Delta now={deltas.rhr.now} prev={deltas.rhr.prev} lowerIsBetter unit=" bpm" /></div>
          </div>
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">HRV · 7d</div>
            <div className="text-base"><Delta now={deltas.hrv.now} prev={deltas.hrv.prev} unit=" ms" /></div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          {(Object.keys(metricCfg) as Metric[]).map(k => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                metric === k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {metricCfg[k].label}
            </button>
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto">{t("recoveryLast30d")}</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={m.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }}
                formatter={(v: any) => v == null ? "—" : `${Number(v).toFixed(metric === "sleep" ? 1 : 0)}${m.unit}`}
              />
              <Area type="monotone" dataKey={m.key} name={m.label} stroke={m.color} fill="url(#recGrad)" strokeWidth={2.5} connectNulls dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Load vs recovery overlay */}
      {overlayData.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">{t("recoveryLoadVsRecovery")}</h4>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={overlayData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="minutes" name={t("recoveryTrainingMinutes")} fill="hsl(190, 95%, 50%)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgHrv" name={t("recoveryAvgHrv")} stroke="hsl(160, 80%, 45%)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
