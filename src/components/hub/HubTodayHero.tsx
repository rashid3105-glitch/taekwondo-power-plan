import { useMemo, useState } from "react";
import { Play, Battery, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { normalizeDaySessions, type PlanSession } from "@/lib/planSessionUtils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { haptics } from "@/lib/haptics";

interface Plan {
  id: string;
  name: string;
  plan_data: any;
  is_active: boolean;
}

interface Props {
  activePlan: Plan | undefined;
  onGoToPlan: () => void;
  // Pass through to today session detail (we use a minimal sheet linking to plan)
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

function extractTags(sessions: PlanSession[]): string[] {
  const tags = new Set<string>();
  sessions.forEach((s) => {
    if (s.focus) {
      // Split focus into a couple of short tags by comma / slash / "og"/"and"
      s.focus
        .split(/[,/]| og | and | & /i)
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && p.length <= 24)
        .slice(0, 4)
        .forEach((p) => tags.add(p));
    }
  });
  return Array.from(tags).slice(0, 4);
}

export function HubTodayHero({ activePlan, onGoToPlan }: Props) {
  const { t, locale } = useLanguage();
  const todayIdx = new Date().getDay();
  const weekday = DAY_NAMES_BY_LOCALE[locale]?.[todayIdx] ?? DAY_NAMES_BY_LOCALE.en[todayIdx];

  const schedule: any[] = activePlan?.plan_data?.weeklySchedule || [];
  const todayDay = useMemo(
    () => schedule.find((d: any) => dayMatches(d?.dayOfWeek, todayIdx)) || null,
    [schedule, todayIdx],
  );
  const sessions: PlanSession[] = todayDay ? normalizeDaySessions(todayDay) : [];
  const isRest = !activePlan
    ? false
    : sessions.length === 0 || sessions.every((s) => s.type === "rest" || s.type === "recovery");

  const primary = sessions.find((s) => s.type !== "rest" && s.type !== "recovery") || sessions[0];
  const title = primary?.focus || primary?.label || (activePlan?.plan_data?.planName ?? "");
  const tags = extractTags(sessions);

  // Approx duration / level. Plans sometimes carry day.duration / day.intensity. Fall back gracefully.
  const duration: string | null =
    todayDay?.durationMinutes ? `${todayDay.durationMinutes} ${t("minutesShort")}` :
    primary?.exercises && primary.exercises.length ? `${primary.exercises.length} ${t("todayExercisesCount")}` :
    null;
  const level: string | null = todayDay?.intensity || activePlan?.plan_data?.level || null;
  const subParts = [duration, level].filter(Boolean) as string[];

  // No active plan → CTA
  if (!activePlan) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border border-l-[3px] border-l-tab-plan bg-card/80 backdrop-blur-sm p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <span className="inline-flex items-center rounded-full border border-tab-plan/40 bg-tab-plan/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-tab-plan">
              {t("todayCardTitle")} · {weekday}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-card-foreground tracking-tight">
              {t("hubTrainingTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("hubTrainingDesc")}</p>
          </div>
          <Button onClick={onGoToPlan} size="lg" className="shrink-0">
            <Sparkles className="h-4 w-4 mr-1" />
            {t("plan")}
          </Button>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    haptics.tap();
    onGoToPlan();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border border-l-[3px] border-l-destructive bg-card/80 backdrop-blur-sm p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <span className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
            {t("todayCardTitle")} · {weekday}
          </span>
          {isRest ? (
            <>
              <h2 className="text-xl sm:text-2xl font-extrabold text-card-foreground tracking-tight flex items-center gap-2">
                <Battery className="h-5 w-5 text-speed" />
                {t("todayRestTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("todayRestBody")}</p>
            </>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-extrabold text-card-foreground tracking-tight truncate">
                {title || t("todaySessionTkd")}
              </h2>
              {subParts.length > 0 && (
                <p className="text-sm text-muted-foreground">{subParts.join(" · ")}</p>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[11px] font-medium bg-secondary/40 border-border/60"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {!isRest && (
          <Button
            onClick={handleStart}
            size="lg"
            className="shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full px-5"
          >
            <Play className="h-4 w-4 mr-1 fill-current" />
            {t("startSession")}
          </Button>
        )}
      </div>
    </div>
  );
}
