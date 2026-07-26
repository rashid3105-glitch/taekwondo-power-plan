/**
 * Utilities for multi-session training plan support.
 * Each day can have multiple sessions (e.g. morning gym + evening TKD).
 * Legacy plans store a single type/label/focus/exercises per day;
 * new plans store a `sessions` array.
 */

export interface PlanSession {
  type: "tkd" | "gym" | "recovery" | "rest" | "selftraining";
  label: string;
  focus?: string;
  exercises?: any[];
}

/**
 * Normalize a day entry into an array of sessions.
 * Works for both old (single-session) and new (multi-session) formats.
 */
export function normalizeDaySessions(day: any): PlanSession[] {
  if (day.sessions && Array.isArray(day.sessions) && day.sessions.length > 0) {
    return day.sessions;
  }
  return [
    {
      type: day.type || "rest",
      label: day.label || day.dayOfWeek || "",
      focus: day.focus,
      exercises: day.exercises || [],
    },
  ];
}

/**
 * Flatten a day with sessions back to the stored format.
 * Always stores in the new `sessions` format.
 */
export function buildDayWithSessions(
  dayOfWeek: string,
  sessions: PlanSession[]
): any {
  // Also keep top-level type/label for backward compat with consumers
  // that only read day.type (e.g. calendar export, week overview icons)
  const primary = sessions[0] || { type: "rest", label: dayOfWeek };
  return {
    dayOfWeek,
    type: sessions.length === 1 ? primary.type : "gym", // multi-session → show gym icon
    label: sessions.length === 1 ? primary.label : sessions.map((s) => s.label).join(" + "),
    focus: sessions.length === 1 ? primary.focus : undefined,
    exercises: sessions.length === 1 ? (primary.exercises || []) : undefined,
    sessions,
  };
}

/**
 * Count total exercises across all sessions for a day.
 */
export function countDayExercises(day: any): number {
  const sessions = normalizeDaySessions(day);
  return sessions.reduce((sum, s) => sum + (s.exercises?.length || 0), 0);
}

/** Weekday tokens per JS day index (0=Sunday) across supported locales. */
const DAY_TOKENS: string[][] = [
  ["sunday", "søndag", "söndag", "sonntag", "domingo", "الأحد"],
  ["monday", "mandag", "måndag", "montag", "lunes", "الإثنين", "الاثنين"],
  ["tuesday", "tirsdag", "tisdag", "dienstag", "martes", "الثلاثاء"],
  ["wednesday", "onsdag", "mittwoch", "miércoles", "miercoles", "الأربعاء"],
  ["thursday", "torsdag", "donnerstag", "jueves", "الخميس"],
  ["friday", "fredag", "freitag", "viernes", "الجمعة"],
  ["saturday", "lørdag", "lördag", "samstag", "sábado", "sabado", "السبت"],
];

/** True when a stored `dayOfWeek` string matches the given JS day index (0=Sunday). */
export function dayOfWeekMatches(dayOfWeek: unknown, jsDayIndex: number): boolean {
  if (typeof dayOfWeek !== "string") return false;
  const lower = dayOfWeek.toLowerCase().trim();
  if (!lower) return false;
  return DAY_TOKENS[jsDayIndex]?.some((tok) => lower.startsWith(tok)) ?? false;
}

/**
 * Find the plan day for a given JS day index (0=Sunday).
 * Prefers an explicit `dayOfWeek` / `day_of_week` field; only falls back to
 * Monday-first array position when NO entry in the plan carries a day field.
 */
export function findPlanDayForToday(days: any[], jsDayIndex: number = new Date().getDay()): any | null {
  if (!Array.isArray(days) || days.length === 0) return null;

  // Numeric day_of_week (0 = Monday) — season-style plans
  const mon0 = (jsDayIndex + 6) % 7;
  const numeric = days.find((d) => typeof d?.day_of_week === "number" && d.day_of_week === mon0);
  if (numeric) return numeric;

  const hasNamed = days.some((d) => typeof d?.dayOfWeek === "string" && d.dayOfWeek.trim());
  if (hasNamed) {
    return days.find((d) => dayOfWeekMatches(d?.dayOfWeek, jsDayIndex)) ?? null;
  }

  // Legacy plans without any day identifier: assume Monday-first array order.
  return days[mon0] ?? null;
}

/** A day is a genuine rest day when it has no non-rest sessions. */
export function isRestDay(day: any): boolean {
  if (!day) return false;
  const sessions = normalizeDaySessions(day);
  return sessions.every((s) => !s || s.type === "rest" || s.type === "recovery");
}
