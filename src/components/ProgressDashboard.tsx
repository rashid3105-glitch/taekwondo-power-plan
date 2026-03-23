import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, TrendingUp, Target, Calendar, Zap, Brain, ClipboardList } from "lucide-react";
import { PhysicalTestProgress } from "@/components/PhysicalTestProgress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";

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

function StatCard({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

export function ProgressDashboard({ onGoToPlan }: { onGoToPlan?: () => void }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [mentalAssessments, setMentalAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const stats = useMemo(() => {
    if (!logs.length) return null;

    const completedLogs = logs.filter((l) => l.completed);
    const completionRate = Math.round((completedLogs.length / logs.length) * 100);
    const totalSets = completedLogs.reduce((sum, l) => sum + (l.actual_sets ?? 0), 0);
    const uniqueDays = new Set(completedLogs.map((l) => l.logged_date)).size;

    const weeklyMap = new Map<string, { completed: number; total: number; volume: number }>();
    for (const log of logs) {
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

    const today = new Date();
    const consistencyData: { day: string; logged: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLogs = completedLogs.filter((l) => l.logged_date === dateStr);
      consistencyData.push({
        day: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        logged: dayLogs.length,
      });
    }

    const schedule = plan?.plan_data?.weeklySchedule || [];
    const dayCompletionData = schedule.map((day: any, i: number) => {
      const dayLogs = logs.filter((l) => l.day_index === i);
      const dayCompleted = dayLogs.filter((l) => l.completed);
      return {
        name: day.dayOfWeek?.slice(0, 3) || `Day ${i + 1}`,
        rate: dayLogs.length > 0 ? Math.round((dayCompleted.length / dayLogs.length) * 100) : 0,
        fill: `hsl(190, 95%, ${50 + i * 5}%)`,
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

    return { completionRate, totalSets, uniqueDays, weeklyData, consistencyData, dayCompletionData, streak, totalExercises: completedLogs.length };
  }, [logs, plan]);

  const mentalStats = useMemo(() => {
    if (!mentalAssessments.length) return null;
    const latest = mentalAssessments[0];
    const scores = latest.scores as Record<string, number>;
    const categories = Object.entries(scores);
    const best = categories.reduce((a, b) => (b[1] > a[1] ? b : a));
    const worst = categories.reduce((a, b) => (b[1] < a[1] ? b : a));
    return { latest, total: mentalAssessments.length, best, worst };
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

  // Training plan progress
  const planProgress = useMemo(() => {
    if (!plan?.plan_data) return null;
    const schedule = plan.plan_data?.weeklySchedule || [];
    const totalExercises = schedule.reduce((sum: number, day: any) => sum + (day.exercises?.length || 0), 0);
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasWorkoutData = stats && logs.length > 0;
  const hasMentalData = mentalAssessments.length > 0;

  if (!hasWorkoutData && !hasMentalData && !planProgress) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-1">{t("noWorkoutData")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("noWorkoutDataDesc")}</p>
        {onGoToPlan && (
          <Button onClick={onGoToPlan} size="sm">{t("goToPlan")}</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">{t("progressDashboard")}</h2>

      {/* Workout stat cards */}
      {hasWorkoutData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon={Target} label={t("completion")} value={`${stats.completionRate}%`} />
            <StatCard icon={TrendingUp} label={t("totalSets")} value={String(stats.totalSets)} />
            <StatCard icon={Calendar} label={t("daysTrained")} value={String(stats.uniqueDays)} />
            <StatCard icon={Zap} label={t("streak")} value={`${stats.streak}d`} />
          </div>

          {/* Weekly volume chart */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">{t("weeklyTrainingVolume")}</h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(210, 20%, 95%)" }}
                  />
                  <Bar dataKey="volume" name={t("totalSets")} fill="hsl(190, 95%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exercises" name={t("completion")} fill="hsl(35, 100%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion rate over time */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <h3 className="text-sm font-bold text-foreground mb-4">{t("weeklyCompletionRate")}</h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(210, 20%, 95%)" }}
                    formatter={(value: number) => [`${value}%`, t("completion")]}
                  />
                  <Area
                    type="monotone"
                    dataKey="completionRate"
                    stroke="hsl(160, 80%, 45%)"
                    fill="hsl(160, 80%, 45%)"
                    fillOpacity={0.15}
                    strokeWidth={2}
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
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full aspect-square rounded-md border border-border transition-colors"
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
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dayCompletionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} width={40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 18%)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`${value}%`, t("completion")]}
                    />
                    <Bar dataKey="rate" fill="hsl(190, 95%, 50%)" radius={[0, 4, 4, 0]} />
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
            {/* Category breakdown bar */}
            <div className="space-y-2 mt-3">
              {Object.entries(mentalStats.latest.scores as Record<string, number>).map(([cat, score]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24 truncate">{categoryLabel(cat)}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(score / 5) * 100}%`,
                        backgroundColor: score >= 4 ? "hsl(160, 80%, 45%)" : score >= 3 ? "hsl(35, 100%, 55%)" : "hsl(0, 70%, 55%)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{score}/5</span>
                </div>
              ))}
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
    </div>
  );
}
