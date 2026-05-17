import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  type ClubSeasonPlan,
  type ClubSeasonPhase,
  type ClubSeasonDayTemplate,
  type AthleteSeasonOverride,
  addDays,
  dayOfWeekMon0,
  isoWeekNumber,
  phaseForWeek,
  resolveSessionForDate,
  seasonWeekNumber,
  sessionLabelKey,
  sessionRowClass,
} from "@/lib/seasonCalendar";
import { cn } from "@/lib/utils";

interface Props {
  seasonPlan: ClubSeasonPlan;
  phases: ClubSeasonPhase[];
  template: ClubSeasonDayTemplate[];
  overrides?: AthleteSeasonOverride[];
  competitionDates?: string[];
  /** Where the "view full" link goes. Default = /coach/season-calendar. */
  fullLink?: string;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function SeasonCalendarMini({
  seasonPlan,
  phases,
  template,
  overrides = [],
  competitionDates = [],
  fullLink = "/coach/season-calendar",
}: Props) {
  const { t } = useLanguage();
  const compSet = useMemo(() => new Set(competitionDates), [competitionDates]);

  // Anchor to Monday of the current week (or season start if before)
  const todayIso = new Date().toISOString().slice(0, 10);
  const anchor = todayIso < seasonPlan.start_date ? seasonPlan.start_date : todayIso;
  const dow = dayOfWeekMon0(anchor);
  const weekStart = addDays(anchor, -dow);

  const weeks = Array.from({ length: 5 }, (_, w) => {
    const wStart = addDays(weekStart, w * 7);
    const days = Array.from({ length: 7 }, (_, d) => addDays(wStart, d));
    const wkNum = seasonWeekNumber(seasonPlan.start_date, wStart);
    return { wStart, days, wkNum, phase: phaseForWeek(phases, wkNum) };
  });

  return (
    <Card className="p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm">{t("seasonCalendar")}</h3>
          <p className="text-xs text-muted-foreground">{seasonPlan.name}</p>
        </div>
        <Link to={fullLink} className="text-xs text-primary hover:underline whitespace-nowrap">
          {t("seasonViewFull")} →
        </Link>
      </div>

      <div className="space-y-2">
        {weeks.map(({ wStart, days, wkNum, phase }) => (
          <div key={wStart} className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{t("seasonWeek")} {isoWeekNumber(wStart)}</span>
              {phase && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: `${phase.color}22`, color: phase.color }}
                >
                  {phase.name}
                </span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((iso, i) => {
                const inSeason = iso >= seasonPlan.start_date && iso <= seasonPlan.end_date;
                const s = inSeason
                  ? resolveSessionForDate(iso, template, overrides, compSet)
                  : null;
                const isToday = iso === todayIso;
                return (
                  <div
                    key={iso}
                    className={cn(
                      "rounded p-1.5 text-center min-h-12 border border-border/40",
                      s ? sessionRowClass(s.type) : "opacity-40",
                      isToday && "ring-2 ring-primary",
                    )}
                    title={iso}
                  >
                    <div className="text-[9px] text-muted-foreground">{DAY_LABELS[i]}</div>
                    <div className="text-[10px] font-bold uppercase">
                      {s ? t(sessionLabelKey(s.type) as any) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
