/**
 * Utilities for multi-session training plan support.
 * Each day can have multiple sessions (e.g. morning gym + evening TKD).
 * Legacy plans store a single type/label/focus/exercises per day;
 * new plans store a `sessions` array.
 */

export interface PlanSession {
  type: "tkd" | "gym" | "recovery" | "rest";
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
