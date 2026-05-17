/**
 * Shared helpers + types for the club-level periodized Season Calendar.
 * Tables: club_season_plans, club_season_phases, club_season_day_templates,
 * club_athlete_season_overrides.
 */

export type SessionType = "tkd" | "gym" | "rest" | "styrke" | "stævne";

export interface ClubSeasonPlan {
  id: string;
  club_id: string;
  created_by: string;
  name: string;
  start_date: string; // yyyy-mm-dd, ISO Monday-anchored not required
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface ClubSeasonPhase {
  id: string;
  season_plan_id: string;
  name: string;
  focus_label: string | null;
  color: string; // hex #rrggbb
  start_week: number; // 1-indexed (season-relative)
  end_week: number;
  sort_order: number;
  focus_tags: string[];
}

/** Catalogue of training focus tags for season phases. i18n keys live in translations.ts. */
export const PHASE_FOCUS_TAGS = [
  { value: "technique",         labelKey: "phaseFocusTechnique" },
  { value: "conditioning",      labelKey: "phaseFocusConditioning" },
  { value: "sparring",          labelKey: "phaseFocusSparring" },
  { value: "strength",          labelKey: "phaseFocusStrength" },
  { value: "competition_prep",  labelKey: "phaseFocusCompetitionPrep" },
  { value: "recovery",          labelKey: "phaseFocusRecovery" },
  { value: "mental",            labelKey: "phaseFocusMental" },
] as const;
export type PhaseFocusTag = typeof PHASE_FOCUS_TAGS[number]["value"];

export interface ClubSeasonDayTemplate {
  id: string;
  season_plan_id: string;
  day_of_week: number; // 0=Mon..6=Sun
  session_type: SessionType;
  location: string | null;
  notes: string | null;
}

export interface AthleteSeasonOverride {
  id: string;
  season_plan_id: string;
  athlete_id: string;
  override_date: string;
  session_type: SessionType | null;
  notes: string | null;
}

export const PHASE_PALETTE = [
  { name: "Blue",   value: "#3b82f6" },
  { name: "Red",    value: "#ef4444" },
  { name: "Green",  value: "#10b981" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Gray",   value: "#6b7280" },
];

export const SESSION_TYPES: SessionType[] = ["tkd", "gym", "styrke", "stævne", "rest"];

/** Tailwind tint classes per session type. Keeps the calendar visually distinct. */
export function sessionRowClass(t: SessionType | null | undefined): string {
  switch (t) {
    case "tkd":     return "bg-primary/10";
    case "gym":
    case "styrke":  return "bg-emerald-500/10";
    case "stævne":  return "bg-destructive/15 font-semibold";
    case "rest":
    default:        return "";
  }
}

export function sessionLabelKey(t: SessionType | null | undefined): string {
  switch (t) {
    case "tkd":    return "sessionTypeTkd";
    case "gym":    return "sessionTypeGym";
    case "styrke": return "sessionTypeStyrke";
    case "stævne": return "sessionTypeStaevne";
    case "rest":
    default:       return "sessionTypeRest";
  }
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000,
  );
}

/** 0 = Monday, 6 = Sunday */
export function dayOfWeekMon0(iso: string): number {
  const d = new Date(iso + "T00:00:00").getDay(); // 0=Sun
  return (d + 6) % 7;
}

/** ISO 8601 week number */
export function isoWeekNumber(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

/** Returns season week number (1-based) for any ISO date inside the plan. */
export function seasonWeekNumber(seasonStart: string, iso: string): number {
  return Math.floor(daysBetween(seasonStart, iso) / 7) + 1;
}

/** ISO year for a given date (Monday-of-week's Thursday rule). */
export function isoWeekYear(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return d.getFullYear();
}

/** Returns ISO Monday-anchored date (yyyy-mm-dd) for a given ISO week + year. */
export function dateOfIsoWeek(isoYear: number, isoWeek: number): string {
  // Jan 4 is always in ISO week 1.
  const jan4 = new Date(isoYear, 0, 4);
  const jan4Dow = (jan4.getDay() + 6) % 7; // 0=Mon
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Dow);
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (isoWeek - 1) * 7);
  return target.toISOString().slice(0, 10);
}

/** Convert an ISO week (+year) to a season-week index (1-based). May be <1 or >totalWeeks. */
export function isoWeekToSeasonWeek(seasonStart: string, isoYear: number, isoWeek: number): number {
  const monday = dateOfIsoWeek(isoYear, isoWeek);
  return seasonWeekNumber(seasonStart, monday);
}

/** Convert a season-week index (1-based) back to its ISO week + year. */
export function seasonWeekToIso(seasonStart: string, seasonWeek: number): { isoWeek: number; isoYear: number } {
  const iso = addDays(seasonStart, (seasonWeek - 1) * 7);
  return { isoWeek: isoWeekNumber(iso), isoYear: isoWeekYear(iso) };
}

/** Find phase covering this season week. */
export function phaseForWeek(phases: ClubSeasonPhase[], weekNumber: number): ClubSeasonPhase | null {
  return phases.find((p) => p.start_week <= weekNumber && p.end_week >= weekNumber) ?? null;
}

/** Resolve the effective session for a given date given template + overrides + competitions. */
export function resolveSessionForDate(
  iso: string,
  template: ClubSeasonDayTemplate[],
  overrides: AthleteSeasonOverride[],
  competitionDates: Set<string>,
): { type: SessionType; location: string | null; fromOverride: boolean; isCompetition: boolean } {
  const ov = overrides.find((o) => o.override_date === iso);
  if (ov?.session_type) {
    return { type: ov.session_type, location: null, fromOverride: true, isCompetition: ov.session_type === "stævne" };
  }
  if (competitionDates.has(iso)) {
    return { type: "stævne", location: null, fromOverride: false, isCompetition: true };
  }
  const dow = dayOfWeekMon0(iso);
  const t = template.find((d) => d.day_of_week === dow);
  return {
    type: (t?.session_type as SessionType) ?? "rest",
    location: t?.location ?? null,
    fromOverride: false,
    isCompetition: false,
  };
}
