import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Battery, Shield, Dumbbell, Check, ChevronDown, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/i18n/LanguageContext";
import { normalizeDaySessions, type PlanSession } from "@/lib/planSessionUtils";
import { useOfflineWorkoutLogs } from "@/hooks/useOfflineWorkoutLogs";
import { supabase } from "@/integrations/supabase/client";
import { haptics } from "@/lib/haptics";
import { FeatureEmptyState } from "@/components/FeatureEmptyState";

interface Plan {
  id: string;
  name: string;
  plan_data: any;
  is_active: boolean;
}

interface Props {
  activePlan: Plan | undefined;
  onGoToProgress: () => void;
  onGoToPlan: () => void;
}

const DAY_NAMES_BY_LOCALE: Record<string, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  da: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"],
  no: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"],
  sv: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"],
  de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

const ALL_DAY_TOKENS = [
  ["sunday", "søndag", "söndag", "sonntag", "الأحد"],
  ["monday", "mandag", "måndag", "montag", "الإثنين", "الاثنين"],
  ["tuesday", "tirsdag", "tisdag", "dienstag", "الثلاثاء"],
  ["wednesday", "onsdag", "mittwoch", "الأربعاء"],
  ["thursday", "torsdag", "donnerstag", "الخميس"],
  ["friday", "fredag", "freitag", "الجمعة"],
  ["saturday", "lørdag", "lördag", "samstag", "السبت"],
];

function dayMatches(dayOfWeek: string | undefined, todayIdx: number) {
  if (!dayOfWeek) return false;
  const lower = dayOfWeek.toLowerCase().trim();
  return ALL_DAY_TOKENS[todayIdx]?.some((tok) => lower.startsWith(tok));
}

export function TodayCard({ activePlan, onGoToProgress, onGoToPlan }: Props) {
  const { t, locale } = useLanguage();
  const todayIdx = new Date().getDay(); // 0=Sun
  const schedule: any[] = activePlan?.plan_data?.weeklySchedule || [];

  const { todayDay, dayIndex } = useMemo(() => {
    const i = schedule.findIndex((d: any) => dayMatches(d?.dayOfWeek, todayIdx));
    return { todayDay: i >= 0 ? schedule[i] : null, dayIndex: i };
  }, [schedule, todayIdx]);

  const sessions: PlanSession[] = todayDay ? normalizeDaySessions(todayDay) : [];
  const [openSession, setOpenSession] = useState<number | null>(null);

  if (!activePlan) {
    return (
      <div className="rounded-2xl border border-border bg-card/80 p-1 shadow-card">
        <FeatureEmptyState
          icon={Play}
          titleKey="hubTrainingTitle"
          descKey="hubTrainingDesc"
          ctaKey="hubTrainingTitle"
          onCta={onGoToPlan}
          accentClass="text-tab-plan"
          iconBgClass="bg-tab-plan/15"
        />
      </div>
    );
  }

  const isRest = sessions.length === 0 || sessions.every((s) => s.type === "rest" || s.type === "recovery");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border border-l-[3px] border-l-tab-plan bg-card/80 backdrop-blur-sm p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("todayCardTitle")}</h3>
        <span className="text-xs text-muted-foreground">
          {DAY_NAMES_BY_LOCALE[locale]?.[todayIdx] ?? DAY_NAMES_BY_LOCALE.en[todayIdx]}
        </span>
      </div>

      {isRest ? (
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-speed/15">
            <Battery className="h-5 w-5 text-speed" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-card-foreground">{t("todayRestTitle")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{t("todayRestBody")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, si) => (
            <SessionRow
              key={si}
              session={s}
              planId={activePlan.id}
              dayIndex={dayIndex}
              sessionIndex={si}
              onStart={() => { haptics.tap(); setOpenSession(si); }}
            />
          ))}
        </div>
      )}

      {openSession !== null && (
        <SessionDialog
          open
          onClose={() => setOpenSession(null)}
          session={sessions[openSession]}
          planId={activePlan.id}
          dayIndex={dayIndex}
          sessionIndex={openSession}
          onGoToProgress={onGoToProgress}
        />
      )}
    </div>
  );
}

function SessionRow({
  session, planId, dayIndex, sessionIndex, onStart,
}: {
  session: PlanSession; planId: string; dayIndex: number; sessionIndex: number; onStart: () => void;
}) {
  const { t } = useLanguage();
  const isTkd = session.type === "tkd";
  const exercises = session.exercises || [];
  const total = isTkd ? 1 : exercises.length || 1;
  const { logs } = useOfflineWorkoutLogs(planId, dayIndex, sessionIndex);
  const completedCount = logs.filter((l) => l.completed).length;
  const allDone = completedCount >= total;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isTkd ? "bg-gradient-energy" : "bg-gradient-power"}`}>
          {isTkd ? <Shield className="h-4 w-4 text-white" /> : <Dumbbell className="h-4 w-4 text-white" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {isTkd ? t("todaySessionTkd") : t("todaySessionGym")}
            </Badge>
            {!isTkd && exercises.length > 0 && (
              <span className="text-xs text-muted-foreground">{exercises.length} {t("todayExercisesCount")}</span>
            )}
          </div>
          {session.focus && <p className="text-sm font-semibold text-card-foreground mt-1 truncate">{session.focus}</p>}
        </div>
      </div>
      {allDone ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-speed/15 text-speed border border-speed/30 px-2.5 py-1 text-xs font-bold">
          <Check className="h-3 w-3" /> {t("todayCompleted")}
        </span>
      ) : (
        <Button size="sm" onClick={onStart}>{t("todayStart")}</Button>
      )}
    </div>
  );
}

function SessionDialog({
  open, onClose, session, planId, dayIndex, sessionIndex, onGoToProgress,
}: {
  open: boolean; onClose: () => void; session: PlanSession;
  planId: string; dayIndex: number; sessionIndex: number; onGoToProgress: () => void;
}) {
  const { t, locale } = useLanguage();
  const isTkd = session.type === "tkd";
  const exercises = session.exercises || [];
  const total = isTkd ? 1 : exercises.length;
  const { logs, upsertLog } = useOfflineWorkoutLogs(planId, dayIndex, sessionIndex);
  const completedCount = logs.filter((l) => l.completed).length;
  const allDone = total > 0 && completedCount >= total;
  const [showDone, setShowDone] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const dateLabel = new Date().toLocaleDateString(locale, { day: "numeric", month: "long" });

  const handleFinish = async () => {
    setFinishing(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() } as any).eq("user_id", data.user.id);
      }
    } catch { /* ignore */ }
    setFinishing(false);
    setShowDone(true);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase">{isTkd ? t("todaySessionTkd") : t("todaySessionGym")}</Badge>
              <span className="text-base font-bold">{session.label || session.focus || (isTkd ? t("todaySessionTkd") : t("todaySessionGym"))}</span>
            </div>
            <p className="text-xs text-muted-foreground font-normal mt-1">{dateLabel}</p>
          </SheetTitle>
          <Progress value={(completedCount / Math.max(total, 1)) * 100} className="h-1.5 mt-2" />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isTkd ? (
            <TkdRunner
              focus={session.focus}
              completed={logs[0]?.completed === true}
              onMark={async () => { haptics.tap(); await upsertLog(0, { completed: true }); }}
            />
          ) : (
            exercises.map((ex: any, i: number) => (
              <GymExerciseCard
                key={i}
                exercise={ex}
                completed={logs.find((l) => l.exercise_index === i)?.completed === true}
                onComplete={async () => {
                  haptics.tap();
                  await upsertLog(i, { completed: true, actual_sets: ex.sets, actual_reps: ex.reps });
                }}
              />
            ))
          )}
        </div>

        <div className="p-4 border-t border-border pb-[env(safe-area-inset-bottom)]">
          <Button className="w-full" size="lg" disabled={!allDone || finishing} onClick={handleFinish}>
            {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : t("todayFinish")}
          </Button>
        </div>

        {showDone && <CompletionMoment onProgress={() => { onClose(); onGoToProgress(); }} onHome={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function TkdRunner({ focus, completed, onMark }: { focus?: string; completed: boolean; onMark: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center space-y-4">
      {focus && <p className="text-base text-card-foreground">{focus}</p>}
      {completed ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-speed/15 text-speed border border-speed/30 px-3 py-1.5 text-sm font-bold">
          <Check className="h-4 w-4" /> {t("todayCompleted")}
        </div>
      ) : (
        <Button size="lg" onClick={onMark} className="w-full">{t("todayMarkDone")}</Button>
      )}
    </div>
  );
}

function GymExerciseCard({ exercise, completed, onComplete }: { exercise: any; completed: boolean; onComplete: () => void }) {
  const { t } = useLanguage();
  const setsTotal = Number(exercise?.sets) || 1;
  const [checked, setChecked] = useState<boolean[]>(() => Array(setsTotal).fill(false));

  useEffect(() => {
    if (completed) setChecked(Array(setsTotal).fill(true));
  }, [completed, setsTotal]);

  useEffect(() => {
    if (!completed && checked.length === setsTotal && checked.every(Boolean)) {
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  if (completed) {
    return (
      <div className="rounded-xl border-2 border-speed/40 bg-speed/5 p-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-speed/20">
          <Check className="h-4 w-4 text-speed" />
        </div>
        <p className="font-semibold text-card-foreground flex-1 truncate">{exercise.name}</p>
        <span className="text-xs text-speed font-bold uppercase">{t("todayCompleted")}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <p className="font-bold text-card-foreground">{exercise.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {setsTotal} × {exercise.reps}
          {exercise.tempo ? ` @ ${exercise.tempo}` : ""}
          {exercise.rest ? ` · ${exercise.rest}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {checked.map((c, i) => (
          <label
            key={i}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
              c ? "border-speed/40 bg-speed/10" : "border-border bg-secondary/30"
            }`}
          >
            <Checkbox
              checked={c}
              onCheckedChange={(v) => {
                haptics.tap();
                setChecked((prev) => prev.map((x, idx) => (idx === i ? v === true : x)));
              }}
            />
            <span className="text-xs font-semibold">{i + 1}</span>
          </label>
        ))}
      </div>

      {exercise.coachingCue && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-primary">
            {t("todayCue")} <ChevronDown className="h-3 w-3" />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-xs text-muted-foreground mt-1">{exercise.coachingCue}</CollapsibleContent>
        </Collapsible>
      )}
      {exercise.whyItMatters && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-primary">
            {t("todayWhy")} <ChevronDown className="h-3 w-3" />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-xs text-muted-foreground mt-1">{exercise.whyItMatters}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function CompletionMoment({ onProgress, onHome }: { onProgress: () => void; onHome: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm p-6 text-center animate-in fade-in duration-300">
      <svg width="120" height="120" viewBox="0 0 120 120" className="text-speed">
        <circle
          cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="4"
          strokeDasharray="340" strokeDashoffset="340"
          style={{ animation: "today-circle 0.5s ease-out forwards" }}
        />
        <path
          d="M38 62 L54 78 L84 46" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="80" strokeDashoffset="80"
          style={{ animation: "today-check 0.4s ease-out 0.4s forwards" }}
        />
      </svg>
      <style>{`
        @keyframes today-circle { to { stroke-dashoffset: 0; } }
        @keyframes today-check { to { stroke-dashoffset: 0; } }
      `}</style>
      <div>
        <h2 className="text-2xl font-extrabold text-card-foreground">{t("todayDoneTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("todayDoneBody")}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button size="lg" onClick={onProgress}>{t("todaySeeProgress")}</Button>
        <Button size="lg" variant="outline" onClick={onHome}>{t("todayGoHome")}</Button>
      </div>
    </div>
  );
}
