/**
 * Sport-driven grade helpers.
 *
 * Phase 2 of the sport-agnostic roadmap. These functions let the UI display
 * and edit an athlete's grade (belt_level) using labels appropriate for the
 * athlete's club sport, instead of hardcoded taekwondo belt terms.
 *
 * For taekwondo clubs everything is unchanged — the existing 6-belt system
 * (white/yellow/green/blue/red/black) with full i18n is used.
 * For other sports the SportProfile's grade ladder is used instead.
 */

import { getSportProfile, type SportProfile, type SportSlug } from "@/config/sportProfiles";
import type { Locale } from "@/i18n/translations";

/** Legacy TKD belt values stored in profiles.belt_level */
export const TKD_BELT_KEYS: Record<string, string> = {
  white: "onbBeltWhite",
  yellow: "onbBeltYellow",
  green: "onbBeltGreen",
  blue: "onbBeltBlue",
  red: "onbBeltRed",
  black: "onbBeltBlack",
};

/**
 * Full taekwondo grade ladder: 10 kup grades (with belt colours, incl. tip
 * belts) followed by the black-belt dan grades.
 */
export interface TkdGrade {
  /** Stored value in profiles.belt_level */
  value: string;
  /** Belt colour keys (two entries = tip belt) */
  colors: string[];
  kup?: number;
  dan?: number;
}

export const TKD_GRADE_LADDER: TkdGrade[] = [
  { value: "10th kup", colors: ["white"], kup: 10 },
  { value: "9th kup", colors: ["white", "yellow"], kup: 9 },
  { value: "8th kup", colors: ["yellow"], kup: 8 },
  { value: "7th kup", colors: ["yellow", "green"], kup: 7 },
  { value: "6th kup", colors: ["green"], kup: 6 },
  { value: "5th kup", colors: ["green", "blue"], kup: 5 },
  { value: "4th kup", colors: ["blue"], kup: 4 },
  { value: "3rd kup", colors: ["blue", "red"], kup: 3 },
  { value: "2nd kup", colors: ["red"], kup: 2 },
  { value: "1st kup", colors: ["red", "black"], kup: 1 },
  { value: "1st dan", colors: ["black"], dan: 1 },
  { value: "2nd dan", colors: ["black"], dan: 2 },
  { value: "3rd dan", colors: ["black"], dan: 3 },
  { value: "4th dan", colors: ["black"], dan: 4 },
  { value: "5th dan", colors: ["black"], dan: 5 },
];

export const TKD_BELT_ORDER = TKD_GRADE_LADDER.map((g) => g.value);

/** Colour-only label, e.g. "Hvidt bælte/Gult bælte". */
function tkdColorLabel(grade: TkdGrade, t: (key: string) => string): string {
  return grade.colors.map((c) => t(TKD_BELT_KEYS[c] ?? c)).join(" / ");
}

/** "Hvidt bælte · 10. kup" / "Sort bælte · 1. dan" */
export function tkdGradeLabel(grade: TkdGrade, t: (key: string) => string): string {
  const suffix = grade.dan ? `${grade.dan}. dan` : `${grade.kup}. kup`;
  return `${tkdColorLabel(grade, t)} · ${suffix}`;
}


/**
 * Returns true if the sport uses the legacy TKD belt system
 * (6 English belt values stored in profiles.belt_level).
 */
export function isTkdBeltSystem(sportSlug?: string | null): boolean {
  return getSportProfile(sportSlug).slug === "taekwondo";
}

/**
 * Resolve the grade label for a sport (e.g. "Bælte" for TKD, "Niveau" for kickboxing).
 * TKD uses the existing i18n key; other sports use the config label with
 * a simple locale fallback (full i18n comes in phase 5).
 */
export function gradeLabelFor(
  sportSlug: string | null | undefined,
  t: (key: string) => string,
  locale?: Locale,
): string {
  const profile = getSportProfile(sportSlug);
  if (profile.slug === "taekwondo") {
    return t("beltLevel");
  }
  // Phase 2: use config labels. Full i18n arrives in phase 5.
  return locale === "da" ? profile.gradeLabel : profile.gradeLabelEn;
}

/**
 * Format a stored belt_level value for display, using the sport's terminology.
 *
 * TKD: translates the English belt name to the localized version (e.g. "red" → "Rødt bælte").
 * Other sports: returns the value as-is (the grade strings are already descriptive,
 * e.g. "3. kyu (brun)" or "Øvet").
 */
export function formatGrade(
  sportSlug: string | null | undefined,
  value: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!value) return "—";
  const profile = getSportProfile(sportSlug);
  if (profile.slug === "taekwondo") {
    const grade = TKD_GRADE_LADDER.find((g) => g.value.toLowerCase() === value.toLowerCase());
    if (grade) return tkdGradeLabel(grade, t);
    // Legacy colour-only values ("white", "red", ...)
    const key = TKD_BELT_KEYS[value.toLowerCase()];
    if (key) return t(key);
    return value;
  }
  return value;
}

/**
 * Return the list of selectable grade options for a sport.
 * TKD: the 6 legacy belt values.
 * Other sports: the profile's full grade ladder.
 */
export function gradeOptions(sportSlug: string | null | undefined): string[] {
  const profile = getSportProfile(sportSlug);
  if (profile.slug === "taekwondo") {
    return TKD_BELT_ORDER;
  }
  return profile.grades;
}

/**
 * Return a display label for a single grade option (for dropdown items).
 */
export function gradeOptionLabel(
  sportSlug: string | null | undefined,
  option: string,
  t: (key: string) => string,
): string {
  const profile = getSportProfile(sportSlug);
  if (profile.slug === "taekwondo") {
    const grade = TKD_GRADE_LADDER.find((g) => g.value.toLowerCase() === option.toLowerCase());
    if (grade) return tkdGradeLabel(grade, t);
    const key = TKD_BELT_KEYS[option.toLowerCase()];
    if (key) return t(key);
    return option;
  }
  return option;
}
