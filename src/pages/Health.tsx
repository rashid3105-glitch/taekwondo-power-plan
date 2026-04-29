import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Footprints, Heart, Flame, Watch, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import { tap } from "@/lib/haptics";
import {
  BarChart, Bar, LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Moon, HeartPulse, Waves } from "lucide-react";
import { getStatus, getSyncStats, syncSince, type WearableStatus } from "@/lib/wearables";

interface DailyRow {
  summary_date: string;
  steps: number | null;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}
interface WorkoutSample {
  id: string;
  start_at: string;
  end_at: string | null;
  source_device: string | null;
  payload: any;
  value_numeric: number | null;
}

export default function Health() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [steps, setSteps] = useState<DailyRow[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSample[]>([]);
  const [status, setStatus] = useState<WearableStatus | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const since14 = new Date(Date.now() - 14 * 86400_000).toISOString();

    const [{ data: prof }, { data: sums }, { data: ws }, st] = await Promise.all([
      supabase.from("profiles").select("age").eq("user_id", user.id).maybeSingle(),
      supabase.from("wearable_daily_summary")
        .select("summary_date,steps,sleep_minutes,resting_hr,hrv_rmssd,baseline_hr_7d,baseline_hrv_7d")
        .eq("user_id", user.id)
        .gte("summary_date", since)
        .order("summary_date", { ascending: true }),
      supabase.from("wearable_samples")
        .select("id,start_at,end_at,source_device,payload,value_numeric")
        .eq("user_id", user.id)
        .eq("metric_type", "workout")
        .gte("start_at", since14)
        .order("start_at", { ascending: false })
        .limit(40),
      getStatus(),
    ]);
    setAge(((prof as any)?.age as number | null) ?? null);
    setSteps((sums ?? []) as DailyRow[]);
    setWorkouts((ws ?? []) as WorkoutSample[]);
    setStatus(st);
    setLoaded(true);
  }

  useEffect(() => { void load(); }, []);

  const stepData = useMemo(() => steps.map(r => ({
    date: r.summary_date.slice(5),
    steps: r.steps ?? 0,
  })), [steps]);

  const stepsTotals = useMemo(() => {
    const last7 = steps.slice(-7).map(r => r.steps ?? 0);
    const today = last7[last7.length - 1] ?? 0;
    const yday = last7[last7.length - 2] ?? 0;
    const avg7 = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
    return { today, yday, avg7, delta: today - yday };
  }, [steps]);

  // Recovery series for charts (sleep / RHR / HRV) — strip nulls
  const sleepData = useMemo(
    () => steps.map(r => ({
      date: r.summary_date.slice(5),
      hours: r.sleep_minutes != null ? Math.round((r.sleep_minutes / 60) * 10) / 10 : null,
    })),
    [steps],
  );
  const rhrData = useMemo(
    () => steps.map(r => ({
      date: r.summary_date.slice(5),
      rhr: r.resting_hr != null ? Math.round(Number(r.resting_hr)) : null,
      baseline: r.baseline_hr_7d != null ? Math.round(Number(r.baseline_hr_7d)) : null,
    })),
    [steps],
  );
  const hrvData = useMemo(
    () => steps.map(r => ({
      date: r.summary_date.slice(5),
      hrv: r.hrv_rmssd != null ? Math.round(Number(r.hrv_rmssd) * 10) / 10 : null,
      baseline: r.baseline_hrv_7d != null ? Math.round(Number(r.baseline_hrv_7d) * 10) / 10 : null,
    })),
    [steps],
  );

  function lastNonNull<T extends keyof DailyRow>(field: T): number | null {
    for (let i = steps.length - 1; i >= 0; i--) {
      const v = steps[i][field];
      if (v != null) return Number(v);
    }
    return null;
  }
  function avgLast7(field: keyof DailyRow): number | null {
    const vals = steps.slice(-7).map(r => r[field]).filter(v => v != null).map(Number);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  const sleepLast = lastNonNull("sleep_minutes");
  const rhrLast = lastNonNull("resting_hr");
  const hrvLast = lastNonNull("hrv_rmssd");
  const sleepAvg7 = avgLast7("sleep_minutes");
  const rhrAvg7 = avgLast7("resting_hr");
  const hrvAvg7 = avgLast7("hrv_rmssd");
  const rhrBase = lastNonNull("baseline_hr_7d");
  const hrvBase = lastNonNull("baseline_hrv_7d");
  const hasSleep = steps.some(r => r.sleep_minutes != null);
  const hasRhr = steps.some(r => r.resting_hr != null);
  const hasHrv = steps.some(r => r.hrv_rmssd != null);

  const workoutSummary = useMemo(() => {
    if (!workouts.length) return null;
    let totalMin = 0, totalCal = 0, hrSum = 0, hrCount = 0;
    for (const w of workouts) {
      const p = w.payload || {};
      totalMin += Number(p.duration_minutes ?? w.value_numeric ?? 0);
      totalCal += Number(p.calories ?? 0);
      if (typeof p.avg_hr === "number") { hrSum += p.avg_hr; hrCount += 1; }
    }
    return {
      count: workouts.length,
      totalMin: Math.round(totalMin),
      totalCal: Math.round(totalCal),
      avgHr: hrCount ? Math.round(hrSum / hrCount) : null,
    };
  }, [workouts]);

  // HR zones: % of max HR (220 - age). 5 standard zones.
  const hrZones = useMemo(() => {
    const maxHr = age ? 220 - age : 190;
    const zones = [
      { name: "Z1", lo: 0.50, hi: 0.60, color: "hsl(200, 85%, 55%)" },
      { name: "Z2", lo: 0.60, hi: 0.70, color: "hsl(160, 75%, 45%)" },
      { name: "Z3", lo: 0.70, hi: 0.80, color: "hsl(45, 90%, 55%)" },
      { name: "Z4", lo: 0.80, hi: 0.90, color: "hsl(20, 90%, 55%)" },
      { name: "Z5", lo: 0.90, hi: 1.10, color: "hsl(0, 80%, 55%)" },
    ].map(z => ({ ...z, loBpm: Math.round(z.lo * maxHr), hiBpm: Math.round(z.hi * maxHr), minutes: 0 }));
    for (const w of workouts) {
      const p = w.payload || {};
      const avgHr: number | null = typeof p.avg_hr === "number" ? p.avg_hr : null;
      const mins: number = Number(p.duration_minutes ?? w.value_numeric ?? 0);
      if (!avgHr || !mins) continue;
      const z = zones.find(zz => avgHr >= zz.loBpm && avgHr < zz.hiBpm) ?? zones[zones.length - 1];
      z.minutes += mins;
    }
    return { maxHr, zones };
  }, [workouts, age]);

  async function handleSync() {
    tap();
    setBusy(true);
    try {
      const since = status?.last_sync_at ?? new Date(Date.now() - 86400_000).toISOString();
      const inserted = await syncSince(since);
      if (inserted === 0) {
        toast({ title: t("healthNoNewData" as any), description: t("healthNoNewDataDesc" as any) });
      } else {
        toast({ title: t("wearableSyncDone" as any), description: `+${inserted}` });
      }
      await load();
    } catch (e: any) {
      toast({ title: t("error" as any), description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto">
      <PageMeta title="Health · Sportstalent" description="Steps, workouts and heart-rate zones from your watch." noindex />
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back" as any) || "Back"}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("healthPageTitle" as any) || "Health"}</h1>
          <p className="text-sm text-muted-foreground">{t("healthPageSubtitle" as any) || "Steps, workouts and heart-rate zones from your watch."}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={busy || !status?.connected}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${busy ? "animate-spin" : ""}`} />
          {t("wearableSyncNow")}
        </Button>
      </div>

      {/* Connection strip */}
      <div className={`mb-4 flex items-center gap-3 rounded-lg border px-3 py-2 ${
        status?.connected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-amber-500/30 bg-amber-500/5"
      }`}>
        <Watch className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 text-sm">
          {status?.connected ? (
            <>
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 mr-2">Active</Badge>
              {status.device_label || (status.provider === "apple_health" ? "Apple Health" : "Health Connect")}
              {status.last_sync_at ? <span className="text-muted-foreground"> · {new Date(status.last_sync_at).toLocaleString()}</span> : null}
            </>
          ) : (
            <span>{t("healthNotConnected" as any) || "Not connected. Open Wearables to set up your watch."}</span>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate("/wearables")}>
          {t("healthManage" as any) || "Manage"}
        </Button>
      </div>

      {/* Steps */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Footprints className="h-4 w-4 text-primary" /> {t("healthStepsTitle" as any) || "Steps"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={t("healthStepsToday" as any) || "Today"} value={stepsTotals.today.toLocaleString()} />
            <Stat label={t("healthStepsAvg7" as any) || "7-day avg"} value={stepsTotals.avg7.toLocaleString()} />
            <Stat
              label={t("healthStepsDelta" as any) || "vs yesterday"}
              value={`${stepsTotals.delta >= 0 ? "+" : ""}${stepsTotals.delta.toLocaleString()}`}
              tone={stepsTotals.delta >= 0 ? "good" : "bad"}
            />
          </div>
          <div className="h-44">
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
        </CardContent>
      </Card>

      {/* Sleep */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" /> {t("healthSleepTitle" as any) || "Sleep"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasSleep ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-center">
                <Stat
                  label={t("healthSleepLast" as any) || "Last night"}
                  value={sleepLast != null ? `${(sleepLast / 60).toFixed(1)}h` : "—"}
                />
                <Stat
                  label={t("healthSleepAvg7" as any) || "7-night avg"}
                  value={sleepAvg7 != null ? `${(sleepAvg7 / 60).toFixed(1)}h` : "—"}
                />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="h" />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                    <Bar dataKey="hours" fill="hsl(220, 70%, 55%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EmptyMetric label={t("healthSleepEmpty" as any) || "No sleep data yet. Grant Sleep access in Apple Health → Sharing → SPORTS TALENT, then Sync now."} />
          )}
        </CardContent>
      </Card>

      {/* Resting HR */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" /> {t("healthRhrTitle" as any) || "Resting heart rate"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasRhr ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label={t("healthRhrLast" as any) || "Latest"} value={rhrLast != null ? `${Math.round(rhrLast)} bpm` : "—"} />
                <Stat label={t("healthRhrAvg7" as any) || "7-day avg"} value={rhrAvg7 != null ? `${Math.round(rhrAvg7)} bpm` : "—"} />
                <Stat
                  label={t("healthRhrDelta" as any) || "vs baseline"}
                  value={rhrLast != null && rhrBase != null ? `${rhrLast - rhrBase >= 0 ? "+" : ""}${Math.round(rhrLast - rhrBase)}` : "—"}
                  tone={rhrLast != null && rhrBase != null ? (rhrLast - rhrBase <= 0 ? "good" : "bad") : undefined}
                />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rhrData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                    <Line type="monotone" dataKey="rhr" stroke="hsl(0, 75%, 55%)" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EmptyMetric label={t("healthRhrEmpty" as any) || "No resting heart rate yet. Apple Watch records this automatically — sync after a few days of wear."} />
          )}
        </CardContent>
      </Card>

      {/* HRV */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Waves className="h-4 w-4 text-primary" /> {t("healthHrvTitle" as any) || "Heart-rate variability (HRV)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasHrv ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label={t("healthHrvLast" as any) || "Latest"} value={hrvLast != null ? `${Math.round(hrvLast)} ms` : "—"} />
                <Stat label={t("healthHrvAvg7" as any) || "7-day avg"} value={hrvAvg7 != null ? `${Math.round(hrvAvg7)} ms` : "—"} />
                <Stat
                  label={t("healthHrvDelta" as any) || "vs baseline"}
                  value={hrvLast != null && hrvBase != null ? `${hrvLast - hrvBase >= 0 ? "+" : ""}${Math.round(hrvLast - hrvBase)}` : "—"}
                  tone={hrvLast != null && hrvBase != null ? (hrvLast - hrvBase >= 0 ? "good" : "bad") : undefined}
                />
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hrvData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit=" ms" />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 11 }} />
                    <Line type="monotone" dataKey="hrv" stroke="hsl(160, 75%, 45%)" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="baseline" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="4 4" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <EmptyMetric label={t("healthHrvEmpty" as any) || "No HRV data yet. Apple Watch records this overnight — wear it to bed and sync the next day."} />
          )}
        </CardContent>
      </Card>

      {/* Workouts */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" /> {t("healthWorkoutsTitle" as any) || "Workouts (last 14 days)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workoutSummary ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              <Stat label={t("healthWoCount" as any) || "Sessions"} value={workoutSummary.count} />
              <Stat label={t("healthWoMinutes" as any) || "Minutes"} value={workoutSummary.totalMin} />
              <Stat label={t("healthWoCalories" as any) || "Calories"} value={workoutSummary.totalCal.toLocaleString()} />
              <Stat label={t("healthWoAvgHr" as any) || "Avg HR"} value={workoutSummary.avgHr ?? "—"} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("healthNoWorkouts" as any) || "No workouts captured yet. Try a session with your watch and sync again."}</p>
          )}

          {workouts.length > 0 && (
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {workouts.slice(0, 14).map(w => {
                const p = w.payload || {};
                const start = new Date(w.start_at);
                return (
                  <div key={w.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.workoutType || "Workout"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {p.source ? ` · ${p.source}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">{Math.round(Number(p.duration_minutes ?? w.value_numeric ?? 0))} min</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.avg_hr ? `${p.avg_hr} bpm` : "—"}
                        {p.calories ? ` · ${Math.round(p.calories)} kcal` : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HR zones */}
      {workouts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" /> {t("healthHrZonesTitle" as any) || "Heart-rate zones"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {t("healthHrZonesHint" as any) || `Estimated max HR ${hrZones.maxHr} bpm (220 − age). Minutes spent per workout's average HR.`}
            </p>
            {hrZones.zones.map(z => {
              const total = hrZones.zones.reduce((s, x) => s + x.minutes, 0) || 1;
              const pct = Math.round((z.minutes / total) * 100);
              return (
                <div key={z.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{z.name} <span className="text-muted-foreground">{z.loBpm}–{z.hiBpm} bpm</span></span>
                    <span className="text-muted-foreground">{z.minutes} min · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: z.color }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!loaded && <p className="text-center text-sm text-muted-foreground py-6">Loading…</p>}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-500" : tone === "bad" ? "text-rose-500" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
