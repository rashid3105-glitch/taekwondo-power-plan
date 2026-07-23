import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, Calendar, CalendarRange, ClipboardList, Eye, Flame,
  Heart, Loader2, Scale, Smile, Trophy, Video as VideoIcon, Zap,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { FormCurveChart } from "@/components/FormCurveChart";
import { AthleteRecoveryTrend } from "@/components/coach/AthleteRecoveryTrend";
import { PhysicalTestComparison } from "@/components/coach/PhysicalTestComparison";
import { MonthlyDevelopmentReportsCard } from "@/components/coach/MonthlyDevelopmentReportsCard";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CompetitionPlanDialog } from "@/components/CompetitionPlanDialog";

interface Props {
  athleteId: string;
  athleteName: string;
  plannedSessionsPerWeek?: number;
}

interface SessionBucket {
  weekLabel: string;
  weekStart: string;
  logged: number;
  planned: number;
}

interface UpcomingComp {
  id: string;
  name: string;
  event_date: string;
  location: string | null;
  weight_class_kg: number | null;
  priority: string | null;
  plan_data: any;
}

interface DiaryRow {
  entry_date: string;
  mood: number | null;
  energy: number | null;
}

const WEEKS = 8;

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday-start
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - diff);
  return out;
}

export function AthleteOverviewTab({ athleteId, athleteName, plannedSessionsPerWeek = 0 }: Props) {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { activeClubId } = useActiveClub();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionBucket[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingComp[]>([]);
  const [diary, setDiary] = useState<DiaryRow[]>([]);
  const [readinessAvg7d, setReadinessAvg7d] = useState<number | null>(null);
  const [latestReadiness, setLatestReadiness] = useState<number | null>(null);
  const [activePR, setActivePR] = useState<{ test_name: string; value: number; unit: string } | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [currentKgInput, setCurrentKgInput] = useState<string>("");
  const [targetKgInput, setTargetKgInput] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogComp, setPlanDialogComp] = useState<UpcomingComp | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, activeClubId]);


  async function load() {
    setLoading(true);
    const today = new Date();
    const eightWeeksAgo = new Date(today);
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * WEEKS);
    const isoStart = eightWeeksAgo.toISOString().slice(0, 10);

    const [logsRes, compRes, diaryRes, readyRes, prRes] = await Promise.all([
      supabase
        .from("workout_logs")
        .select("logged_date, completed")
        .eq("user_id", athleteId)
        .gte("logged_date", isoStart),
      supabase
        .from("competitions")
        .select("id, name, event_date, location, weight_class_kg, priority, plan_data")
        .eq("user_id", athleteId)
        .gte("event_date", today.toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(3),
      (() => {
        let q: any = supabase
          .from("diary_entries")
          .select("entry_date, mood, energy")
          .eq("user_id", athleteId)
          .gte("entry_date", isoStart)
          .order("entry_date", { ascending: false });
        if (activeClubId) q = q.or(`club_id.eq.${activeClubId},club_id.is.null`);
        return q;
      })(),

      supabase
        .from("readiness_checkins")
        .select("score, checkin_date")
        .eq("user_id", athleteId)
        .gte("checkin_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
        .order("checkin_date", { ascending: false }),
      supabase
        .from("physical_test_results")
        .select("test_name, value, unit, test_date")
        .eq("user_id", athleteId)
        .order("test_date", { ascending: false })
        .limit(1),
    ]);

    // Sessions vs planned (8 weeks)
    const buckets: SessionBucket[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const weekStart = startOfWeek(new Date(today.getTime() - i * 7 * 86400000));
      const next = new Date(weekStart);
      next.setDate(next.getDate() + 7);
      const startIso = weekStart.toISOString().slice(0, 10);
      const endIso = next.toISOString().slice(0, 10);
      const logged = (logsRes.data || []).filter(
        (l: any) => l.completed && l.logged_date >= startIso && l.logged_date < endIso,
      ).length;
      buckets.push({
        weekLabel: weekStart.toLocaleDateString(locale, { month: "short", day: "numeric" }),
        weekStart: startIso,
        logged,
        planned: plannedSessionsPerWeek || 0,
      });
    }
    setSessions(buckets);
    setUpcoming((compRes.data as UpcomingComp[]) || []);
    setDiary((diaryRes.data as DiaryRow[]) || []);

    const readyRows = (readyRes.data as { score: number }[]) || [];
    if (readyRows.length > 0) {
      setLatestReadiness(readyRows[0].score);
      setReadinessAvg7d(readyRows.reduce((s, r) => s + r.score, 0) / readyRows.length);
    }
    if (prRes.data && prRes.data.length > 0) {
      setActivePR(prRes.data[0] as any);
    }
    setLoading(false);
  }

  const totals = useMemo(() => {
    const logged = sessions.reduce((s, b) => s + b.logged, 0);
    const planned = sessions.reduce((s, b) => s + b.planned, 0);
    return { logged, planned, completion: planned > 0 ? Math.round((logged / planned) * 100) : 0 };
  }, [sessions]);

  const moodAvg = useMemo(() => {
    const recent = diary.slice(0, 14).filter((d) => d.mood != null);
    if (recent.length === 0) return null;
    return recent.reduce((s, d) => s + (d.mood || 0), 0) / recent.length;
  }, [diary]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const Kpi = ({
    icon: Icon, label, value, hint, tone = "default",
  }: {
    icon: any; label: string; value: string; hint?: string; tone?: "default" | "warn" | "good" | "danger";
  }) => (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 shadow-card",
        tone === "warn" && "border-amber-400/40",
        tone === "good" && "border-emerald-500/40",
        tone === "danger" && "border-destructive/40",
        tone === "default" && "border-border",
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <Icon className={cn(
          "h-4 w-4",
          tone === "warn" && "text-amber-500",
          tone === "good" && "text-emerald-500",
          tone === "danger" && "text-destructive",
          tone === "default" && "text-primary",
        )} />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold tabular-nums text-card-foreground">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Kpi
          icon={Activity}
          label={t("readiness")}
          value={latestReadiness != null ? String(latestReadiness) : "—"}
          hint={readinessAvg7d != null ? `${t("avg7d")} ${readinessAvg7d.toFixed(1)}` : t("noData")}
          tone={(latestReadiness ?? 100) < 50 ? "danger" : (latestReadiness ?? 100) < 70 ? "warn" : "good"}
        />
        <Kpi
          icon={ClipboardList}
          label={t("sessions8w")}
          value={`${totals.logged}${totals.planned ? `/${totals.planned}` : ""}`}
          hint={totals.planned ? `${totals.completion}% ${t("completed")}` : t("noPlannedSchedule")}
          tone={totals.planned && totals.completion < 60 ? "warn" : "default"}
        />
        <Kpi
          icon={Smile}
          label={t("moodAvg14d")}
          value={moodAvg != null ? moodAvg.toFixed(1) : "—"}
          hint={moodAvg != null ? `${diary.length} ${t("entries")}` : t("noEntries")}
          tone={moodAvg != null && moodAvg < 2.5 ? "warn" : "default"}
        />
        <Kpi
          icon={Trophy}
          label={t("upcomingComp")}
          value={String(upcoming.length)}
          hint={upcoming[0] ? new Date(upcoming[0].event_date).toLocaleDateString(locale, { month: "short", day: "numeric" }) : t("noneScheduled")}
        />
      </div>

      {/* Sessions vs planned */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" /> {t("sessionsVsPlanned")}
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessions} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8, fontSize: 12,
                }}
              />
              <Bar dataKey="logged" name={t("logged")} radius={[4, 4, 0, 0]}>
                {sessions.map((s, i) => {
                  const ratio = s.planned > 0 ? s.logged / s.planned : 1;
                  const color = ratio >= 0.8 ? "hsl(160 80% 45%)" : ratio >= 0.5 ? "hsl(40 90% 55%)" : "hsl(var(--destructive))";
                  return <Cell key={i} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Form curve (full data viz) */}
      <FormCurveChart userId={athleteId} />

      {/* Recovery trend (renders only if wearable data) */}
      <AthleteRecoveryTrend athleteId={athleteId} />

      {/* Test comparison */}
      <PhysicalTestComparison athleteId={athleteId} />

      {/* Upcoming + quick links */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> {t("upcomingComp")}
          </h4>
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("noneScheduled")}</p>
          ) : (
            <ul className="space-y-1.5">
              {upcoming.map((c) => (
                <li key={c.id} className="text-xs flex items-center justify-between gap-2 border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                  <span className="font-medium text-card-foreground truncate">{c.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {new Date(c.event_date).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {activePR && (
            <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-xs">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-muted-foreground">{t("latestPR")}:</span>
              <span className="font-semibold text-card-foreground">{activePR.test_name} — {activePR.value} {activePR.unit}</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> {t("quickJump")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate(`/season?athlete=${athleteId}`)}
              className="rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors p-3 text-left text-xs flex items-center gap-2"
            >
              <CalendarRange className="h-4 w-4 text-primary" /> {t("seasonPlannerTitle")}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/match-analysis/${athleteId}`)}
              className="rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors p-3 text-left text-xs flex items-center gap-2"
            >
              <VideoIcon className="h-4 w-4 text-primary" /> {t("matchAnalysisTitle")}
            </button>
          </div>
        </div>
      </div>

      <MonthlyDevelopmentReportsCard athleteId={athleteId} athleteName={athleteName} />
    </div>
  );
}
