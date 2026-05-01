import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity, Footprints, RefreshCw, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Moon, HeartPulse, Waves } from "lucide-react";
import { ManualHealthEntryCard } from "@/components/health/ManualHealthEntryCard";
import { HealthSourceGuide } from "@/components/health/HealthSourceGuide";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface DailyRow {
  summary_date: string;
  steps: number | null;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}

export default function Health() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const [steps, setSteps] = useState<DailyRow[]>([]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    // Read both sources in parallel: summary table (manual + mirrored)
    // and the raw iPhone health_data table (in case the mirror trigger
    // is briefly behind).
    const [summaryRes, healthRes] = await Promise.all([
      supabase.from("wearable_daily_summary")
        .select("summary_date,steps,sleep_minutes,resting_hr,hrv_rmssd,baseline_hr_7d,baseline_hrv_7d")
        .eq("user_id", user.id)
        .gte("summary_date", since)
        .order("summary_date", { ascending: true }),
      supabase.from("health_data")
        .select("date,steps,sleep_hours,heart_rate_avg,hrv")
        .eq("user_id", user.id)
        .gte("date", since)
        .order("date", { ascending: true }),
    ]);

    // Merge by date — summary wins, health_data fills any nulls.
    const byDate = new Map<string, DailyRow>();
    for (const r of summaryRes.data ?? []) {
      byDate.set(r.summary_date, {
        summary_date: r.summary_date,
        steps: r.steps ?? null,
        sleep_minutes: r.sleep_minutes ?? null,
        resting_hr: r.resting_hr as number | null,
        hrv_rmssd: r.hrv_rmssd as number | null,
        baseline_hr_7d: r.baseline_hr_7d as number | null,
        baseline_hrv_7d: r.baseline_hrv_7d as number | null,
      });
    }
    for (const h of healthRes.data ?? []) {
      const existing = byDate.get(h.date) ?? {
        summary_date: h.date,
        steps: null, sleep_minutes: null, resting_hr: null, hrv_rmssd: null,
        baseline_hr_7d: null, baseline_hrv_7d: null,
      };
      byDate.set(h.date, {
        ...existing,
        steps: existing.steps ?? (h.steps != null ? Number(h.steps) : null),
        sleep_minutes: existing.sleep_minutes ?? (h.sleep_hours != null ? Math.round(Number(h.sleep_hours) * 60) : null),
        resting_hr: existing.resting_hr ?? (h.heart_rate_avg as number | null),
        hrv_rmssd: existing.hrv_rmssd ?? (h.hrv as number | null),
      });
    }

    const merged = Array.from(byDate.values()).sort((a, b) => a.summary_date.localeCompare(b.summary_date));
    setSteps(merged);
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
  const hasSteps = steps.some(r => r.steps != null && r.steps > 0);

  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto">
      <PageMeta title="Health · Sportstalent" description="Log sleep, resting HR, HRV and steps to track recovery." noindex />
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("back" as any) || "Back"}
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("healthPageTitle" as any) || "Health"}</h1>
          <p className="text-sm text-muted-foreground">
            {t("healthPageSubtitleManual" as any) || "Log sleep, resting heart rate, HRV and steps to track your recovery."}
          </p>
        </div>
      </div>

      {/* Manual entry */}
      <ManualHealthEntryCard onSaved={() => void load()} />

      {/* Where to find numbers */}
      <HealthSourceGuide />

      {/* Steps */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Footprints className="h-4 w-4 text-primary" /> {t("healthStepsTitle" as any) || "Steps"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasSteps ? (
            <>
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
            </>
          ) : (
            <EmptyMetric label={t("healthStepsEmpty" as any) || "No steps logged yet. Use the form above to add today's number."} />
          )}
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
            <EmptyMetric label={t("healthSleepEmptyManual" as any) || "No sleep logged yet. Add your last-night hours above."} />
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
            <EmptyMetric label={t("healthRhrEmptyManual" as any) || "No resting HR logged yet. Add today's reading above."} />
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
            <EmptyMetric label={t("healthHrvEmptyManual" as any) || "No HRV logged yet. Add today's reading above."} />
          )}
        </CardContent>
      </Card>

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

function EmptyMetric({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border px-3 py-3">
      {label}
    </p>
  );
}
