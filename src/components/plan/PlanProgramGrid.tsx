import { useMemo, useRef, useEffect } from "react";
import { Shield, Dumbbell, Battery } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { normalizeDaySessions, type PlanSession } from "@/lib/planSessionUtils";
import { localizeDayOfWeek, localizeExerciseName } from "@/lib/planTranslation";
import {
  computeWeekVariant,
  findPhaseForWeek,
  PHASE_TONE,
  classifyPhase,
  type PeriodizationPhase,
} from "@/lib/planProgression";

const TYPE_ICON: Record<string, typeof Shield> = {
  tkd: Shield,
  gym: Dumbbell,
  recovery: Battery,
  rest: Battery,
};

const PHASE_SHORT_KEY: Record<string, string> = {
  accumulation: "phaseAccumulation",
  intensification: "phaseIntensification",
  peaking: "phasePeaking",
  deload: "phaseDeload",
  adaptation: "phaseAnatomicalAdaptation",
  competition: "phaseCompetition",
  recovery: "phaseRecovery",
  other: "",
};

interface Props {
  weeklySchedule: any[];
  programWeeks: number;
  periodization?: PeriodizationPhase[];
  selectedWeek: number; // 0-based
  selectedDay: number | null;
  currentWeekIndex?: number; // highlight today's week
  onCellClick: (weekIndex: number, dayIndex: number) => void;
}

export function PlanProgramGrid({
  weeklySchedule,
  programWeeks,
  periodization,
  selectedWeek,
  selectedDay,
  currentWeekIndex,
  onCellClick,
}: Props) {
  const { t, locale } = useLanguage();
  const weeks = useMemo(
    () => Array.from({ length: Math.max(1, programWeeks) }, (_, i) => i),
    [programWeeks]
  );
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected week into view on mobile
  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(
      `[data-week="${selectedWeek}"]`
    );
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedWeek]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {(t("programGridTitle") || "Program overview").replace("{{n}}", String(programWeeks))}
        </p>
        <p className="text-[10px] text-muted-foreground hidden sm:block">
          {t("programGridHint") || "Tap a cell to log that day"}
        </p>
      </div>

      <div ref={scrollerRef} className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-10 bg-card border-b border-r border-border p-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                style={{ minWidth: 92 }}
              >
                {t("dayLabel") || "Day"}
              </th>
              {weeks.map((wi) => {
                const { phase, kind } = findPhaseForWeek(periodization, wi);
                const phaseLabelKey = PHASE_SHORT_KEY[kind];
                const phaseLabel = phaseLabelKey ? t(phaseLabelKey) : phase?.phase || "";
                const isCurrent = currentWeekIndex === wi;
                return (
                  <th
                    key={wi}
                    data-week={wi}
                    className={cn(
                      "border-b border-r border-border p-2 align-top scroll-snap-align-start",
                      isCurrent && "bg-primary/5"
                    )}
                    style={{ minWidth: 160 }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-card-foreground">
                        {(t("weekN") || "Week {{n}}").replace("{{n}}", String(wi + 1))}
                      </span>
                      {isCurrent && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-primary">
                          {t("now") || "Now"}
                        </span>
                      )}
                    </div>
                    {phaseLabel && (
                      <span
                        className={cn(
                          "mt-1 inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                          PHASE_TONE[kind]
                        )}
                      >
                        {phaseLabel}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {weeklySchedule.map((day, di) => {
              const sessions = normalizeDaySessions(day);
              const primaryType = sessions[0]?.type || "rest";
              const Icon = TYPE_ICON[primaryType] || Dumbbell;
              return (
                <tr key={di}>
                  <th
                    className="sticky left-0 z-10 bg-card border-b border-r border-border p-2 text-left align-top"
                    style={{ minWidth: 92 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-[11px] font-bold text-card-foreground truncate">
                        {localizeDayOfWeek(day.dayOfWeek, locale)}
                      </span>
                    </div>
                    <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                      {sessions.length > 1
                        ? `${sessions.length} ${t("nSessions") || "sessions"}`
                        : sessions[0]?.label || ""}
                    </span>
                  </th>
                  {weeks.map((wi) => {
                    const isSelected = selectedWeek === wi && selectedDay === di;
                    const isCurrentWeek = currentWeekIndex === wi;
                    return (
                      <td
                        key={wi}
                        className={cn(
                          "border-b border-r border-border p-1.5 align-top transition-colors",
                          isCurrentWeek && "bg-primary/[0.03]"
                        )}
                      >
                        <button
                          onClick={() => onCellClick(wi, di)}
                          aria-label={`Week ${wi + 1}, ${localizeDayOfWeek(day.dayOfWeek, locale)}`}
                          className={cn(
                            "w-full text-left rounded-md border p-1.5 space-y-1 transition-all min-h-[64px] hover:border-primary/60",
                            isSelected
                              ? "border-primary bg-primary/10 shadow-glow"
                              : "border-border bg-secondary/30"
                          )}
                        >
                          {sessions.map((sess: PlanSession, si: number) => (
                            <SessionCellContent
                              key={si}
                              session={sess}
                              weekIndex={wi}
                              periodization={periodization}
                            />
                          ))}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SessionCellContent({
  session,
  weekIndex,
  periodization,
}: {
  session: PlanSession;
  weekIndex: number;
  periodization?: PeriodizationPhase[];
}) {
  const { locale } = useLanguage();
  const exercises = session.exercises || [];
  if (exercises.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground italic truncate">
        {session.label}
      </p>
    );
  }
  const visible = exercises.slice(0, 3);
  const extra = exercises.length - visible.length;
  return (
    <div className="space-y-0.5">
      {visible.map((ex: any, j: number) => {
        const v = computeWeekVariant(ex, weekIndex, periodization);
        return (
          <div key={j} className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-card-foreground truncate">
              <span className="text-muted-foreground mr-1">{v.sets}×{v.repsLabel}</span>
              {localizeExerciseName(ex.name, locale)}
            </span>
            {v.chip && (
              <span className="text-[9px] font-bold text-primary bg-primary/15 rounded px-1 py-0.5 flex-shrink-0">
                {v.chip}
              </span>
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <p className="text-[9px] text-muted-foreground">+{extra}</p>
      )}
    </div>
  );
}
