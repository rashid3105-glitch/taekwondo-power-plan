import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { normalizeDaySessions, type PlanSession } from "@/lib/planSessionUtils";
import { localizeDayOfWeek, localizeExerciseName } from "@/lib/planTranslation";
import {
  findPhaseForWeek,
  classifyPhase,
  computeWeekVariant,
  type PeriodizationPhase,
  type PhaseKind,
} from "@/lib/planProgression";

interface Props {
  weeklySchedule: any[];
  programWeeks: number;
  periodization: PeriodizationPhase[];
  onDaySelect: (weekIndex: number, dayIndex: number) => void;
  selectedWeek?: number;
  selectedDay?: number | null;
}

const PHASE_HEX: Record<PhaseKind, string> = {
  accumulation: "#00C2FF",
  intensification: "#F5A623",
  peaking: "#FF3B5C",
  deload: "#22D3EE",
  adaptation: "#A1A1AA",
  competition: "#FF3B5C",
  recovery: "#22D3EE",
  other: "var(--accent-hex, #00C2FF)",
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

const SESSION_HEX: Record<string, string> = {
  tkd: "#00C2FF",
  gym: "#F5A623",
  recovery: "#22D3EE",
  rest: "#71717A",
};

const SESSION_LABEL: Record<string, string> = {
  tkd: "TKD",
  gym: "GYM",
  recovery: "REC",
  rest: "REST",
};

export function PlanProgramMobile({
  weeklySchedule,
  programWeeks,
  periodization,
  onDaySelect,
  selectedWeek = 0,
  selectedDay = null,
}: Props) {
  const { t, locale } = useLanguage();
  const [activeWeek, setActiveWeek] = useState(selectedWeek);
  const [view, setView] = useState<"week" | "day">("week");
  const [dayInView, setDayInView] = useState<number | null>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveWeek(selectedWeek);
  }, [selectedWeek]);

  useEffect(() => {
    const el = pillsRef.current?.querySelector<HTMLElement>(`[data-week-pill="${activeWeek}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeWeek]);

  const weeks = useMemo(
    () => Array.from({ length: Math.max(1, programWeeks) }, (_, i) => i),
    [programWeeks]
  );

  const { phase, kind } = findPhaseForWeek(periodization, activeWeek);
  const phaseHex = PHASE_HEX[kind];
  const phaseLabelKey = PHASE_SHORT_KEY[kind];
  const phaseLabel = phaseLabelKey ? t(phaseLabelKey) : phase?.phase || "";

  const handleDayClick = (di: number) => {
    setDayInView(di);
    setView("day");
    onDaySelect(activeWeek, di);
  };

  if (view === "day" && dayInView !== null) {
    const day = weeklySchedule[dayInView];
    const sessions = normalizeDaySessions(day);
    return (
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#0f0f0f", border: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => setView("week")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10"
            aria-label="Tilbage"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/90 truncate">
              {localizeDayOfWeek(day.dayOfWeek, locale)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40 truncate">
              {(t("weekN") || "Week {{n}}").replace("{{n}}", String(activeWeek + 1))}
              {phaseLabel && ` · ${phaseLabel}`}
            </p>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {sessions.map((sess: PlanSession, si: number) => {
            const sHex = SESSION_HEX[sess.type] || SESSION_HEX.gym;
            const exercises = sess.exercises || [];
            return (
              <div
                key={si}
                className="rounded-lg p-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: `${sHex}20`,
                      color: sHex,
                      border: `0.5px solid ${sHex}40`,
                    }}
                  >
                    {SESSION_LABEL[sess.type] || sess.type.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-white/60 truncate ml-2">{sess.label}</span>
                </div>
                {exercises.length === 0 ? (
                  <p className="text-[11px] text-white/40 italic">
                    {t("noExercises") || "No exercises"}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {exercises.map((ex: any, j: number) => {
                      const v = computeWeekVariant(ex, activeWeek, periodization);
                      return (
                        <li key={j} className="flex items-start gap-3 text-[12px]">
                          <span className="text-white/30 font-mono tabular-nums w-6 shrink-0">
                            {String(j + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-white/90 leading-snug">
                            {localizeExerciseName(ex.name, locale)}
                          </span>
                          <span className="text-white/50 tabular-nums whitespace-nowrap">
                            {v.sets}×{v.repsLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#0f0f0f", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      {/* Week pills */}
      <div
        ref={pillsRef}
        className="flex gap-1.5 overflow-x-auto px-3 py-3 scrollbar-none"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        {weeks.map((wi) => {
          const { kind: wk } = findPhaseForWeek(periodization, wi);
          const hex = PHASE_HEX[wk];
          const isActive = wi === activeWeek;
          return (
            <button
              key={wi}
              data-week-pill={wi}
              onClick={() => setActiveWeek(wi)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold tabular-nums transition-all"
              )}
              style={
                isActive
                  ? {
                      background: `${hex}20`,
                      color: hex,
                      border: `0.5px solid ${hex}60`,
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.5)",
                      border: "0.5px solid rgba(255,255,255,0.08)",
                    }
              }
            >
              U{wi + 1}
            </button>
          );
        })}
      </div>

      {/* Phase badge */}
      {phaseLabel && (
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: phaseHex }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            {phaseLabel}
          </span>
        </div>
      )}

      {/* Day rows */}
      <div className="p-2 space-y-1.5">
        {weeklySchedule.map((day: any, di: number) => {
          const sessions = normalizeDaySessions(day);
          const primaryType = sessions[0]?.type || "rest";
          const sHex = SESSION_HEX[primaryType] || SESSION_HEX.gym;
          const isSelected = selectedDay === di && activeWeek === selectedWeek;
          return (
            <button
              key={di}
              onClick={() => handleDayClick(di)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all"
              style={{
                background: isSelected
                  ? `${sHex}12`
                  : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${isSelected ? `${sHex}50` : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 w-10 shrink-0">
                {localizeDayOfWeek(day.dayOfWeek, locale).slice(0, 3)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/90 truncate">
                  {sessions.length > 1
                    ? sessions.map((s) => s.label).join(" + ")
                    : sessions[0]?.label || "—"}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {sessions.map((s, i) => {
                    const hex = SESSION_HEX[s.type] || SESSION_HEX.gym;
                    return (
                      <span
                        key={i}
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: `${hex}18`,
                          color: hex,
                          border: `0.5px solid ${hex}35`,
                        }}
                      >
                        {SESSION_LABEL[s.type] || s.type}
                      </span>
                    );
                  })}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Nav bar */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={() => setActiveWeek((w) => Math.max(0, w - 1))}
          disabled={activeWeek === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/70 disabled:opacity-30"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          {t("previous") || "Forrige"}
        </button>
        <div className="flex-1 text-center text-[11px] font-semibold uppercase tracking-wider text-white/60">
          {(t("weekN") || "Uge {{n}}").replace("{{n}}", String(activeWeek + 1))} {t("ofN") ? t("ofN").replace("{{n}}", String(programWeeks)) : `af ${programWeeks}`}
        </div>
        <button
          onClick={() => setActiveWeek((w) => Math.min(programWeeks - 1, w + 1))}
          disabled={activeWeek >= programWeeks - 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-30"
          style={{
            background: `${phaseHex}20`,
            color: phaseHex,
            border: `0.5px solid ${phaseHex}50`,
          }}
        >
          {t("next") || "Næste"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
