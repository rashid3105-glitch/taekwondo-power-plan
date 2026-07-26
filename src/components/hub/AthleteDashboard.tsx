import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useThreads } from "@/hooks/useThreads";
import { Calendar, MessageCircle, Play, BookOpen, Trophy, NotebookPen, CalendarX, Book, Video, BarChart3, CalendarCheck, ClipboardList, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelfTrainingLogDialog } from "@/components/SelfTrainingLogDialog";
import {
  resolveSessionsForDate,
  sessionLabelKey,
  seasonWeekNumber,
  phaseForWeek,
  PHASE_FOCUS_TAGS,
  type AthleteSeasonOverride,
} from "@/lib/seasonCalendar";
import { findPlanDayForToday, normalizeDaySessions, isRestDay } from "@/lib/planSessionUtils";

interface TodaySession {
  type: string;
  tags: string[];
  exercises: string[];
  extraCount: number;
}

interface TodayPlan {
  weekdayLabel: string;
  sessions: TodaySession[];
  isRest: boolean;
}


interface NextCompetition {
  name: string;
  eventDate: Date;
  dateLabel: string;
  location?: string;
}

interface DiaryComment {
  id: string;
  content: string;
  created_at: string;
}

interface LatestDiary {
  id: string;
  entry_date: string;
  created_at: string;
  content: string;
  comments: DiaryComment[];
}

const LOCALE_BCP47: Record<string, string> = {
  en: "en-GB", da: "da-DK", sv: "sv-SE", de: "de-DE", ar: "ar-SA", no: "nb-NO", es: "es-ES",
};
function weekdayLong(locale: string, d: Date = new Date()) {
  try {
    return new Intl.DateTimeFormat(LOCALE_BCP47[locale] || locale, { weekday: "long" }).format(d);
  } catch {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
}

/**
 * Self-contained athlete home dashboard.
 * Rendered only when role === "athlete".
 */
interface ClubSeasonData {
  plan: any;
  phases: any[];
  template: any[];
}

export function AthleteDashboard({ clubSeason }: { clubSeason?: ClubSeasonData | null }) {
  const { role: activeRole } = useRole();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const { totalUnread } = useThreads();

  const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
  const [nextCompetition, setNextCompetition] = useState<NextCompetition | null>(null);
  const [latestDiary, setLatestDiary] = useState<LatestDiary | null>(null);
  const [diaryLoading, setDiaryLoading] = useState(true);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [selfLogOpen, setSelfLogOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [planView, setPlanView] = useState<"mine" | "club">("mine");
  const [seasonOverrides, setSeasonOverrides] = useState<AthleteSeasonOverride[]>([]);
  const [competitionDates, setCompetitionDates] = useState<Set<string>>(() => new Set());

  // Today's sessions derived from the club season plan (visibility already
  // filtered upstream in Dashboard — no extra access logic here).
  const clubToday = useMemo(() => {
    if (!clubSeason?.plan || !Array.isArray(clubSeason.template)) return null;
    const iso = new Date().toISOString().slice(0, 10);
    if (clubSeason.plan.start_date > iso || clubSeason.plan.end_date < iso) return null;
    const resolved = resolveSessionsForDate(
      iso,
      clubSeason.template as any,
      seasonOverrides,
      competitionDates,
    );
    if (!resolved || resolved.length === 0) return null;
    const week = seasonWeekNumber(clubSeason.plan.start_date, iso);
    const phase = phaseForWeek((clubSeason.phases ?? []) as any, week);
    const tags: string[] = ((phase?.focus_tags ?? []) as string[])
      .map((v) => {
        const found = PHASE_FOCUS_TAGS.find((f) => f.value === v);
        return found ? t(found.labelKey as any) : v;
      });
    const dow = (new Date(iso + "T00:00:00").getDay() + 6) % 7; // 0 = Monday
    const isRest = resolved.every((r) => r.type === "rest");
    return {
      isRest,
      sessions: resolved.map((r) => ({
        typeLabel: t(sessionLabelKey(r.type) as any),
        location: r.location,
        fromOverride: r.fromOverride,
        note: ((clubSeason.template as any[]).find(
          (d) => d.day_of_week === dow && d.session_type === r.type,
        )?.notes as string | undefined) ?? null,
      })),
      phaseName: phase?.name ?? null,
      tags,
    };
  }, [clubSeason, t, seasonOverrides, competitionDates]);

  const hasBothPlans = !!todayPlan && !!clubToday;
  const showMine = hasBothPlans ? planView === "mine" : !!todayPlan;


  // Live countdown tick
  useEffect(() => {
    if (!nextCompetition) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [nextCompetition]);

  useEffect(() => {
    let mounted = true;


    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Next competition
      const todayIso = new Date().toISOString().slice(0, 10);
      const { data: comp } = await supabase
        .from("competitions")
        .select("name, event_date, location")
        .eq("user_id", user.id)
        .gte("event_date", todayIso)
        .order("event_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (comp && mounted) {
        const dt = new Date(comp.event_date + "T00:00:00");
        setNextCompetition({
          name: comp.name,
          eventDate: dt,
          dateLabel: dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
          location: comp.location || undefined,
        });
      }

      // Athlete overrides + competition dates for the club season plan
      if (clubSeason?.plan?.id) {
        const { data: ovs } = await supabase
          .from("club_athlete_season_overrides")
          .select("id, season_plan_id, athlete_id, override_date, session_type, notes")
          .eq("season_plan_id", clubSeason.plan.id)
          .eq("athlete_id", user.id);
        if (mounted) setSeasonOverrides((ovs || []) as any as AthleteSeasonOverride[]);
      }
      const { data: allComps } = await supabase
        .from("competitions")
        .select("event_date")
        .eq("user_id", user.id);
      if (mounted) {
        setCompetitionDates(new Set((allComps || []).map((c: any) => c.event_date)));
      }

      // Active plan -> today's sessions
      const { data: plan } = await supabase
        .from("training_plans")
        .select("plan_data")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const pd: any = plan?.plan_data || {};
      const days: any[] = pd.weeklySchedule || pd.days || pd.week || [];
      let today: TodayPlan | null = null;
      const d: any = findPlanDayForToday(days);
      if (d) {
        const daySessions = normalizeDaySessions(d).filter(
          (s: any) => s && (s.label || s.type || s.focus || s.exercises?.length),
        );
        const rest = isRestDay(d);
        const mapped: TodaySession[] = daySessions
          .filter((s: any) => rest || (s.type !== "rest" && s.type !== "recovery"))
          .map((s: any) => {
            const tags: string[] = [];
            if (s.focus) tags.push(String(s.focus));
            if (d.focus && d.focus !== s.focus) tags.push(String(d.focus));
            if (s.duration || s.duration_minutes) {
              tags.push(`${s.duration || s.duration_minutes} min`);
            }
            const allExercises: string[] = Array.isArray(s.exercises)
              ? s.exercises.map((e: any) => e?.name).filter((n: any) => typeof n === "string" && n.trim())
              : [];
            return {
              type: s.label || s.type || d.focus || s.focus || t("train"),
              tags: tags.slice(0, 3),
              exercises: allExercises.slice(0, 5),
              extraCount: Math.max(0, allExercises.length - 5),
            };
          });
        if (mapped.length > 0 || rest) {
          today = {
            weekdayLabel: weekdayLong(locale).toUpperCase(),
            sessions: rest ? [] : mapped,
            isRest: rest,
          };
        }
      }

      if (!mounted) return;
      setTodayPlan(today);
      setIsLoading(false);


      // Latest diary entry + comments
      const { data: entry } = await supabase
        .from("diary_entries")
        .select("id, entry_date, created_at, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (entry && mounted) {
        const { data: cmts } = await supabase
          .from("diary_comments")
          .select("id, content, created_at")
          .eq("diary_entry_id", entry.id)
          .order("created_at", { ascending: true });
        if (mounted) {
          setLatestDiary({
            id: entry.id,
            entry_date: entry.entry_date,
            created_at: entry.created_at,
            content: entry.content || "",
            comments: (cmts || []) as DiaryComment[],
          });
        }
      }
      if (mounted) setDiaryLoading(false);
    })();

    return () => { mounted = false; };
  }, []);


  const countdown = useMemo(() => {
    if (!nextCompetition) return null;
    const diff = nextCompetition.eventDate.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return { days, hours, minutes };
  }, [nextCompetition, now]);

  

  const accentStyle = { color: "var(--accent-hex)" } as const;
  const accentLeftBorder = { borderLeft: "3px solid var(--accent-hex)" } as const;

  const hasCoachComments = !!latestDiary && latestDiary.comments.length > 0;
  const diaryDateLabel = latestDiary
    ? new Date(latestDiary.entry_date + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short", day: "numeric", month: "short",
      })
    : "";
  const diaryPreview = latestDiary
    ? (latestDiary.content || "").trim().split("\n").slice(0, 2).join(" ").slice(0, 140)
    : "";

  return (
    <div
      className="space-y-4 rounded-2xl p-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* 1. TODAY card — fully clickable */}
      {isLoading ? (
        <SkeletonBlock className="h-[112px]" />
      ) : (
        <section
          role="button"
          tabIndex={0}
          onClick={() => navigate("/dashboard?tab=plan")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/dashboard?tab=plan"); } }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
          style={accentLeftBorder}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 shrink-0" style={accentStyle} />
              <h3 className="text-[11px] font-bold uppercase tracking-wider truncate" style={accentStyle}>
                {t("today").toUpperCase()} · {weekdayLong(locale).toUpperCase()}
              </h3>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelfLogOpen(true); }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-colors"
                aria-label={t("hubOwnBtn")}
              >
                <UserIcon className="h-3 w-3" /> {t("hubOwnBtn")}
              </button>
              {todayPlan && !todayPlan.isRest && showMine && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
                >
                  <Play className="h-3 w-3" fill="currentColor" /> Start
                </span>
              )}
            </div>
          </div>

          {hasBothPlans && (
            <div
              className="flex items-center gap-1 mb-3 p-0.5 rounded-lg bg-white/[0.05] w-fit"
              onClick={(e) => e.stopPropagation()}
            >
              {(["mine", "club"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPlanView(v); }}
                  aria-pressed={planView === v}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-colors ${
                    planView === v ? "bg-white/[0.14] text-white" : "text-white/60 hover:text-white/90"
                  }`}
                >
                  {v === "mine" ? t("hubPlanToggleMine") : t("hubPlanToggleClub")}
                </button>
              ))}
            </div>
          )}

          {showMine && todayPlan ? (
            todayPlan.isRest ? (
              <div>
                <p className="text-sm font-semibold text-white">{t("hubRestDay")}</p>
                <p className="text-xs text-white/60 mt-1">{t("hubRestDaySub")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPlan.sessions.map((s, si) => (
                  <div key={si} className={si > 0 ? "pt-3 border-t border-white/10" : undefined}>
                    <p className="text-sm font-semibold text-white">{s.type}</p>
                    {s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/[0.06] text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.exercises.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {s.exercises.map((name, i) => (
                          <li key={i} className="text-xs text-white/80 leading-tight truncate">
                            • {name}
                          </li>
                        ))}
                        {s.extraCount > 0 && (
                          <li className="text-xs text-white/50 leading-tight">
                            +{s.extraCount} {t("hubMoreSuffix")}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : !showMine && clubToday ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/50">
                {t("hubPlanToggleClub")}
              </p>
              {clubToday.isRest ? (
                <>
                  <p className="text-sm font-semibold text-white mt-0.5">{t("hubRestDay")}</p>
                  <p className="text-xs text-white/60 mt-1">{t("hubRestDaySub")}</p>
                </>
              ) : (
                <div className="space-y-2 mt-0.5">
                  {clubToday.sessions.map((s, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-white">
                        {s.typeLabel}
                        {s.location ? ` · ${s.location}` : ""}
                        {s.fromOverride && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.08] text-white/70">
                            {t("hubOverrideBadge")}
                          </span>
                        )}
                      </p>
                      {s.note && (
                        <p className="text-xs text-white/70 mt-1 leading-snug">{s.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {clubToday.phaseName && (
                <p className="text-xs text-white/60 mt-1">{clubToday.phaseName}</p>
              )}
              {clubToday.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {clubToday.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/[0.06] text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (

            <EmptyState
              icon={<CalendarX size={24} style={accentStyle} />}
              text={t("hubNoSessionToday")}
              sub={t("hubCheckPlan")}
            />
          )}
        </section>
      )}

      {/* 2. Next event — fully clickable */}
      {isLoading ? (
        <SkeletonBlock className="h-[140px]" />
      ) : (
        <section
          role="button"
          tabIndex={0}
          onClick={() => navigate("/competitions")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/competitions"); } }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
          style={accentLeftBorder}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4" style={accentStyle} />
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={accentStyle}>
              {t("nextEventTitle")}
            </h3>
          </div>
          {nextCompetition && countdown ? (
            <div>
              <p className="text-sm font-semibold text-white">{nextCompetition.name}</p>
              <p className="text-xs text-white/60 mt-1">
                {nextCompetition.dateLabel}{nextCompetition.location ? ` · ${nextCompetition.location}` : ""}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <CountBox value={countdown.days} label={t("hubCountDays")} accentStyle={accentStyle} />
                <CountBox value={countdown.hours} label={t("hubCountHours")} accentStyle={accentStyle} />
                <CountBox value={countdown.minutes} label={t("hubCountMinutes")} accentStyle={accentStyle} />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Trophy size={24} style={accentStyle} />}
              text={t("hubNoUpcomingComp")}
              sub={t("hubAddNextComp")}
            />
          )}
        </section>
      )}

      {/* 3. Diary — write new / view latest */}
      {diaryLoading ? (
        <SkeletonBlock className="h-[96px]" />
      ) : latestDiary ? (
        <section
          role="button"
          tabIndex={0}
          onClick={() => setDiaryOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDiaryOpen(true); } }}
          className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <NotebookPen className="h-4 w-4" style={accentStyle} />
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={accentStyle}>
              {t("diaryWriteOrLatest")}
            </h3>
            {hasCoachComments && (
              <span
                aria-label={t("hubCoachComments")}
                className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
              />
            )}
          </div>
          <p className="text-[11px] text-white/50">{diaryDateLabel}</p>
          <p className="text-sm text-white mt-1 line-clamp-2">
            {diaryPreview || <span className="text-white/50 italic">{t("hubEmptyEntry")}</span>}
          </p>
        </section>
      ) : (
        <section
          role="button"
          tabIndex={0}
          onClick={() => navigate("/diary")}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/diary"); } }}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <NotebookPen className="h-4 w-4" style={accentStyle} />
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={accentStyle}>
              {t("diaryWriteOrLatest")}
            </h3>
          </div>
          <EmptyState
            icon={<Book size={24} style={accentStyle} />}
            text={t("hubNoDiaryYet")}
          />
        </section>
      )}

      {/* 4. Messages */}
      {isLoading ? (
        <SkeletonBlock className="h-[72px]" />
      ) : totalUnread > 0 ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center relative">
            <MessageCircle className="h-4 w-4" style={accentStyle} />
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-black"
              style={{ backgroundColor: "var(--accent-hex)" }}
            >
              {totalUnread}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{totalUnread} {t("hubUnreadMessages")}</p>
            <p className="text-xs text-white/60">{t("hubFromCoach")}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/messages")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
          >
            {t("hubSeeMessages")}
          </button>
        </section>
      ) : (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <EmptyState
            icon={<MessageCircle size={24} style={accentStyle} />}
            text={t("hubNoNewMessages")}
          />
        </section>
      )}

      {/* 5. Quick access */}
      <section className="grid grid-cols-2 gap-3">
        {activeRole === "coach" ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/library/testing")}
              className="rounded-xl border border-white/15 bg-white/[0.04] p-4 flex items-center gap-2 font-semibold text-sm text-white"
            >
              <ClipboardList className="h-4 w-4" style={accentStyle} />
              {t("ptTestingButton")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/match-analysis/me")}
              className="rounded-xl border border-white/15 bg-white/[0.04] p-4 flex items-center gap-2 font-semibold text-sm text-white"
            >
              <Video className="h-4 w-4" style={accentStyle} />
              {t("hubVideoAnalysis")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/coach/today")}
              className="col-span-2 rounded-xl p-4 flex items-center gap-2 font-semibold text-sm"
              style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
            >
              <CalendarCheck className="h-4 w-4" />
              {t("todayTab")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate("/dashboard?tab=progress")}
              className="rounded-xl p-4 flex items-center gap-2 font-semibold text-sm"
              style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
            >
              <BarChart3 className="h-4 w-4" />
              {t("progress")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/match-analysis/me")}
              className="rounded-xl border border-white/15 bg-white/[0.04] p-4 flex items-center gap-2 font-semibold text-sm text-white"
            >
              <Video className="h-4 w-4" style={accentStyle} />
              {t("hubVideoAnalysis")}
            </button>
          </>
        )}
      </section>

      {/* Diary read-only modal */}
      <Dialog open={diaryOpen} onOpenChange={setDiaryOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{diaryDateLabel || t("hubDiaryTitleFallback")}</DialogTitle>
          </DialogHeader>
          {latestDiary && (
            <div className="space-y-4">
              <p className="text-sm text-white whitespace-pre-wrap">
                {latestDiary.content || <span className="text-white/50 italic">{t("hubEmptyEntry")}</span>}
              </p>

              {latestDiary.comments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                    {t("hubCoachComments")}
                  </p>
                  {latestDiary.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-3"
                    >
                      <p className="text-[10px] text-white/40 mb-1">
                        {new Date(c.created_at).toLocaleDateString(undefined, {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-white whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => { setDiaryOpen(false); navigate("/diary"); }}
                className="w-full rounded-xl p-3 font-semibold text-sm"
                style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
              >
                {t("hubOpenInDiary")}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SelfTrainingLogDialog open={selfLogOpen} onOpenChange={setSelfLogOpen} />
    </div>
  );
}

function CountBox({
  value, label, accentStyle,
}: { value: number; label: string; accentStyle: React.CSSProperties }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/10 py-2 text-center">
      <div className="text-xl font-bold tabular-nums" style={accentStyle}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-white/50 mt-0.5">{label}</div>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-white/10 animate-pulse rounded-xl ${className}`} />;
}

export function EmptyState({
  icon, text, sub,
}: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-4 gap-1.5">
      {icon}
      <p className="text-[13px] text-white text-center">{text}</p>
      {sub && <p className="text-[11px] text-white/50 text-center">{sub}</p>}
    </div>
  );
}
