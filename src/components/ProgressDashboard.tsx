import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, TrendingUp, Target, Calendar, Zap, Brain, ClipboardList, Filter } from "lucide-react";
import { PhysicalTestProgress } from "@/components/PhysicalTestProgress";
import { RunningStatsCard } from "@/components/RunningStatsCard";
import { FormCurveChart } from "@/components/FormCurveChart";
import { RecoveryProgressSection } from "@/components/progress/RecoveryProgressSection";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, Cell,
} from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { normalizeDaySessions } from "@/lib/planSessionUtils";
import { FeatureEmptyState } from "@/components/FeatureEmptyState";

interface WorkoutLog {
  id: string;
  plan_id: string;
  day_index: number;
  exercise_index: number;
  completed: boolean;
  actual_sets: number | null;
  actual_reps: string | null;
  logged_date: string;
}

interface PlanData {
  id: string;
  plan_data: any;
}

function StatCard({ icon: Icon, label, value, sublabel }: { icon: typeof Target; label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-card relative overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-foreground">{value}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>}
    </div>
  );
}

const CHART_COLORS = {
  volume: "hsl(190, 95%, 50%)",
  exercises: "hsl(35, 100%, 55%)",
  completion: "hsl(160, 80%, 45%)",
  day: "hsl(190, 95%, 50%)",
};

type TimeRange = "all" | "4w" | "8w" | "12w";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold text-foreground">{entry.value}{entry.unit || ""}</span>
        </div>
      ))}
    </div>
  );
};

export function ProgressDashboard({ onGoToPlan }: { onGoToPlan?: () => void }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [mentalAssessments, setMentalAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [logsRes, planRes, mentalRes] = await Promise.all([
      supabase.from("workout_logs").select("*").eq("user_id", user.id).order("logged_date", { ascending: true }),
      supabase.from("training_plans").select("id, plan_data, name, created_at").eq("user_id", user.id).eq("is_active", true).single(),
      supabase.from("mental_assessments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (logsRes.data) setLogs(logsRes.data as unknown as WorkoutLog[]);
    if (planRes.data) setPlan(planRes.data as unknown as PlanData);
    if (mentalRes.data) setMentalAssessments(mentalRes.data);
    setLoading(false);
  };

  const filteredLogs = useMemo(() => {
    if (timeRange === "all") return logs;
    const now = new Date();
    const cutoff = new Date();
    const weeks = timeRange === "4w" ? 4 : timeRange === "8w" ? 8 : 12;
    cutoff.setDate(now.getDate() - weeks * 7);
    return logs.filter(l => new Date(l.logged_date) >= cutoff);
  }, [logs, timeRange]);

  const stats = useMemo(() => {
    if (!filteredLogs.length) return null;

    const completedLogs = filteredLogs.filter((l) => l.completed);
    const completionRate = Math.round((completedLogs.length / filteredLogs.length) * 100);
    const totalSets = completedLogs.reduce((sum, l) => sum + (l.actual_sets ?? 0), 0);
    const uniqueDays = new Set(completedLogs.map((l) => l.logged_date)).size;

    const weeklyMap = new Map<string, { completed: number; total: number; volume: number }>();
    for (const log of filteredLogs) {
      const d = new Date(log.logged_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = weekStart.toISOString().split("T")[0];
      if (!weeklyMap.has(key)) weeklyMap.set(key, { completed: 0, total: 0, volume: 0 });
      const w = weeklyMap.get(key)!;
      w.total++;
      if (log.completed) {
        w.completed++;
        w.volume += log.actual_sets ?? 0;
      }
    }

    const weeklyData = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week: new Date(week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        completionRate: Math.round((data.completed / data.total) * 100),
        volume: data.volume,
        exercises: data.completed,
      }));

    // Calculate averages
    const avgVolume = weeklyData.length ? Math.round(weeklyData.reduce((s, w) => s + w.volume, 0) / weeklyData.length) : 0;
    const avgCompletion = weeklyData.length ? Math.round(weeklyData.reduce((s, w) => s + w.completionRate, 0) / weeklyData.length) : 0;

    const today = new Date();
    const consistencyData: { day: string; logged: number; date: string }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = completedLogs.filter((l) => l.logged_date === dateStr);
      consistencyData.push({
        day: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        logged: dayLogs.length,
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      });
    }

    const schedule = plan?.plan_data?.weeklySchedule || [];
    const dayCompletionData = schedule.map((day: any, i: number) => {
      const dayLogs = filteredLogs.filter((l) => l.day_index === i);
      const dayCompleted = dayLogs.filter((l) => l.completed);
      const rate = dayLogs.length > 0 ? Math.round((dayCompleted.length / dayLogs.length) * 100) : 0;
      return {
        name: day.dayOfWeek?.slice(0, 3) || `Day ${i + 1}`,
        rate,
      };
    }).filter((d: any) => d.rate > 0);

    let streak = 0;
    const sortedDates = [...new Set(completedLogs.map((l) => l.logged_date))].sort().reverse();
    const todayStr = today.toISOString().split("T")[0];
    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];
      if (sortedDates.includes(expectedStr)) {
        streak++;
      } else if (expectedStr !== todayStr) {
        break;
      }
    }

    return { completionRate, totalSets, uniqueDays, weeklyData, consistencyData, dayCompletionData, streak, totalExercises: completedLogs.length, avgVolume, avgCompletion };
  }, [filteredLogs, plan]);

  const mentalStats = useMemo(() => {
    if (!mentalAssessments.length) return null;
    const latest = mentalAssessments[0];
    const scores = latest.scores as Record<string, number>;
    const categories = Object.entries(scores);
    const best = categories.reduce((a, b) => (b[1] > a[1] ? b : a));
    const worst = categories.reduce((a, b) => (b[1] < a[1] ? b : a));
    const previous = mentalAssessments[1] || null;
    return { latest, previous, total: mentalAssessments.length, best, worst };
  }, [mentalAssessments]);

  const categoryLabel = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      toughness: { en: "Toughness", da: "Mental styrke" },
      anxiety: { en: "Anxiety Mgmt", da: "Angst" },
      focus: { en: "Focus", da: "Fokus" },
      recovery: { en: "Recovery", da: "Restitution" },
      confidence: { en: "Confidence", da: "Selvtillid" },
      motivation: { en: "Motivation", da: "Motivation" },
    };
    const lang = (t("plan") === "Plan" && t("profile") === "Profile") ? "en" : "da";
    return map[key]?.[lang] || key;
  };

  const planProgress = useMemo(() => {
    if (!plan?.plan_data) return null;
    const schedule = plan.plan_data?.weeklySchedule || [];
    const totalExercises = schedule.reduce((sum: number, day: any) => {
      const sessions = normalizeDaySessions(day);
      return sum + sessions.reduce((s: number, sess: any) => s + (sess.exercises?.length || 0), 0);
    }, 0);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = logs.filter(l => l.plan_id === plan.id && l.logged_date === todayStr && l.completed);
    const allCompleted = logs.filter(l => l.plan_id === plan.id && l.completed);
    const daysWithLogs = new Set(allCompleted.map(l => l.logged_date)).size;
    return {
      name: (plan as any).name || "Training Plan",
      totalDays: schedule.length,
      totalExercises,
      todayCompleted: todayLogs.length,
      totalCompleted: allCompleted.length,
      daysLogged: daysWithLogs,
    };
  }, [plan, logs]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              <div className="h-7 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          <div className="h-48 w-full rounded-lg bg-muted/60 animate-pulse" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-32 w-full rounded-lg bg-muted/60 animate-pulse" />
        </div>
      </div>
    );
  }

  const hasWorkoutData = stats && filteredLogs.length > 0;
  const hasMentalData = mentalAssessments.length > 0;

  if (!hasWorkoutData && !hasMentalData && !planProgress) {
    return (
      <FeatureEmptyState
        icon={BarChart3}
        titleKey="emptyProgressTitle"
        descKey="emptyProgressDesc"
        ctaKey={onGoToPlan ? "emptyProgressCta" : undefined}
        onCta={onGoToPlan}
        accentClass="text-tab-progress"
        iconBgClass="bg-tab-progress/15"
      />
    );
  }

  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: "all", label: t("ptRangeAll") || "All" },
    { key: "4w", label: "4w" },
    { key: "8w", label: "8w" },
    { key: "12w", label: "12w" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{t("progressDashboard")}</h2>
        {/* Time range filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {timeRanges.map(r => (
            <Button
              key={r.key}
              variant={timeRange === r.key ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setTimeRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recovery & wearables (hidden if no watch) */}
      <RecoveryProgressSection />

      {/* Form curve — combined load/strain/output composite */}
      <FormCurveChart />

      {/* Workout stat cards */}
      {hasWorkoutData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={Target} label={t("completion")} value={`${stats.completionRate}%`} sublabel={`avg ${stats.avgCompletion}%`} />
            <StatCard icon={TrendingUp} label={t("totalSets")} value={String(stats.totalSets)} sublabel={`~${stats.avgVolume}/wk`} />
            <StatCard icon={Calendar} label={t("daysTrained")} value={String(stats.uniqueDays)} />
            <StatCard icon={Zap} label={t("streak")} value={`${stats.streak}d`} />
          </div>

          {/* Weekly volume chart */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">{t("weeklyTrainingVolume")}</h3>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} barGap={2}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.volume} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS.volume} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.exercises} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS.exercises} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value: string) => <span className="text-muted-foreground text-xs">{value}</span>}
                  />
                  <Bar dataKey="volume" name={t("totalSets")} fill="url(#volGrad)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exercises" name={t("completion")} fill="url(#exGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion rate over time */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">{t("weeklyCompletionRate")}</h3>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyData}>
                  <defs>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.completion} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={CHART_COLORS.completion} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} unit="%" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="completionRate"
                    name={t("completion")}
                    stroke={CHART_COLORS.completion}
                    fill="url(#compGrad)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: CHART_COLORS.completion, strokeWidth: 2, stroke: "hsl(220, 18%, 10%)" }}
                    activeDot={{ r: 6, fill: CHART_COLORS.completion, stroke: "hsl(220, 18%, 10%)", strokeWidth: 2 }}
                    unit="%"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 28-day consistency heatmap */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">{t("last28DaysConsistency")}</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {stats.consistencyData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 group/cell" title={`${d.date}: ${d.logged} exercises`}>
                  <div
                    className="w-full aspect-square rounded-md border border-border transition-all group-hover/cell:scale-110 group-hover/cell:ring-1 group-hover/cell:ring-primary/30"
                    style={{
                      backgroundColor: d.logged > 0
                        ? `hsl(190, 95%, ${Math.min(30 + d.logged * 15, 55)}%)`
                        : "hsl(220, 15%, 12%)",
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-muted-foreground">{t("less")}</span>
              {[0, 2, 4, 6].map((v) => (
                <div
                  key={v}
                  className="h-3 w-3 rounded-sm border border-border"
                  style={{
                    backgroundColor: v === 0 ? "hsl(220, 15%, 12%)" : `hsl(190, 95%, ${30 + v * 5}%)`,
                  }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">{t("more")}</span>
            </div>
          </div>

          {/* Completion by day of week */}
          {stats.dayCompletionData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
              <h3 className="text-sm font-bold text-foreground mb-4">{t("completionByDay")}</h3>
              <div className="h-52 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dayCompletionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" name={t("completion")} radius={[0, 6, 6, 0]} unit="%">
                      {stats.dayCompletionData.map((_: any, i: number) => (
                        <Cell key={i} fill={`hsl(190, 95%, ${45 + i * 4}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mental Performance Section */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-tab-mental" />
          <h3 className="text-sm font-bold text-foreground">{t("mentalPerformance")}</h3>
        </div>
        {mentalStats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard icon={Target} label={t("latestMentalScore")} value={`${mentalStats.latest.total_score}/30`} />
              <StatCard icon={Calendar} label={t("assessmentsTaken")} value={String(mentalStats.total)} />
              <StatCard icon={TrendingUp} label={t("topStrength")} value={categoryLabel(mentalStats.best[0])} />
              <StatCard icon={Zap} label={t("needsWork")} value={categoryLabel(mentalStats.worst[0])} />
            </div>
            {/* Category breakdown bars */}
            <div className="space-y-2 mt-3">
              {Object.entries(mentalStats.latest.scores as Record<string, number>).map(([cat, score]) => {
                const prevScore = mentalStats.previous?.scores?.[cat];
                const diff = prevScore !== undefined ? score - prevScore : null;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate">{categoryLabel(cat)}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden relative">
                      {/* Previous score indicator */}
                      {prevScore !== undefined && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-foreground/30 z-10"
                          style={{ left: `${(prevScore / 5) * 100}%` }}
                          title={`Previous: ${prevScore}/5`}
                        />
                      )}
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(score / 5) * 100}%`,
                          background: score >= 4
                            ? "linear-gradient(90deg, hsl(160, 80%, 45%), hsl(160, 80%, 55%))"
                            : score >= 3
                            ? "linear-gradient(90deg, hsl(35, 100%, 50%), hsl(35, 100%, 60%))"
                            : "linear-gradient(90deg, hsl(0, 70%, 50%), hsl(0, 70%, 60%))",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right">{score}/5</span>
                    {diff !== null && diff !== 0 && (
                      <span className={`text-[10px] font-bold w-6 ${diff > 0 ? "text-green-500" : "text-red-500"}`}>
                        {diff > 0 ? "+" : ""}{diff}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noMentalData")}</p>
        )}
      </div>

      {/* Training Plan Progress */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("trainingPlanProgress")}</h3>
        </div>
        {planProgress ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard icon={ClipboardList} label={t("activePlan")} value={planProgress.name} />
              <StatCard icon={Calendar} label={t("trainingDays")} value={`${planProgress.totalDays}`} />
              <StatCard icon={Target} label={t("exercisesInPlan")} value={String(planProgress.totalExercises)} />
              <StatCard icon={Zap} label={t("todayCompleted")} value={String(planProgress.todayCompleted)} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">{t("totalLogged")}:</span>
              <span className="text-xs font-bold text-foreground">{planProgress.totalCompleted} {t("exercises")}</span>
              <span className="text-xs text-muted-foreground ml-2">{t("across")}</span>
              <span className="text-xs font-bold text-foreground">{planProgress.daysLogged} {t("daysTrained").toLowerCase()}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noPlanData")}</p>
        )}
      </div>

      {/* Physical Test Progress */}
      <PhysicalTestProgress />

      {/* Running summary (last 30 days) */}
      <RunningStatsCard />
    </div>
  );
}