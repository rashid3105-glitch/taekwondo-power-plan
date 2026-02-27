import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, User, BookOpen, LogOut, Loader2, BarChart3, TrendingUp, Target, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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

export default function Progress() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const [logsRes, planRes] = await Promise.all([
      supabase.from("workout_logs").select("*").eq("user_id", user.id).order("logged_date", { ascending: true }),
      supabase.from("training_plans").select("id, plan_data").eq("user_id", user.id).eq("is_active", true).single(),
    ]);

    if (logsRes.data) setLogs(logsRes.data as unknown as WorkoutLog[]);
    if (planRes.data) setPlan(planRes.data as unknown as PlanData);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-foreground">TKD POWER</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <Zap className="h-4 w-4 mr-1" /> {t("plan")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
              <BookOpen className="h-4 w-4 mr-1" /> {t("library")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile-setup")}>
              <User className="h-4 w-4 mr-1" /> {t("profile")}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm sm:hidden">
        <div className="flex items-center justify-around py-2">
          <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground">
            <Zap className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("plan")}</span>
          </button>
          <button onClick={() => navigate("/progress")} className="flex flex-col items-center gap-0.5 px-3 py-1 text-primary">
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("progress")}</span>
          </button>
          <button onClick={() => navigate("/library")} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("library")}</span>
          </button>
          <button onClick={() => navigate("/profile-setup")} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("profile")}</span>
          </button>
        </div>
      </nav>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">{t("progressDashboard")}</h1>

        {!stats || logs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">{t("noWorkoutData")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("noWorkoutDataDesc")}
            </p>
            <Button onClick={() => navigate("/dashboard")} size="sm">{t("goToPlan")}</Button>
          </div>
        ) : (
          <>
            {/* Stat cards */}
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
      </main>
    </div>
  );
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
