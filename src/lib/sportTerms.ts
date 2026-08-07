/**
 * Sport-driven terminology helpers (phase 5).
 *
 * Taekwondo clubs keep the existing, fully translated strings. Other sports get
 * generic labels built from the sport's own name, so no screen says "Taekwondo"
 * to a karate, kickboxing or fitness club.
 */

import { getSportProfile } from "@/config/sportProfiles";
import type { Locale } from "@/i18n/translations";

type T = (key: string) => string;

/** Localized-ish sport name. Names are proper nouns, so the Danish name works for all locales. */
export function sportName(sportSlug: string | null | undefined, locale?: Locale): string {
  const p = getSportProfile(sportSlug);
  if (p.slug === "fitness") {
    return locale === "en" ? p.nameEn : p.name;
  }
  return p.name;
}

/** "Started taekwondo" → "Started karate" / "Start date" for fitness. */
export function startDateLabel(sportSlug: string | null | undefined, t: T, locale?: Locale): string {
  const p = getSportProfile(sportSlug);
  if (p.slug === "taekwondo") return t("tkdStartDate");
  if (p.slug === "fitness") return t("sportStartDateGeneric");
  return `${t("sportStartedPrefix")} ${sportName(p.slug, locale)}`;
}

/** Short badge label: "TKD/week" → "Karate/week" / "Sessions/week". */
export function sessionsPerWeekLabel(sportSlug: string | null | undefined, t: T, locale?: Locale): string {
  const p = getSportProfile(sportSlug);
  if (p.slug === "taekwondo") return t("tkdPerWeek");
  if (p.slug === "fitness") return t("sessionsPerWeekGeneric");
  return `${sportName(p.slug, locale)}/${t("perWeekSuffix")}`;
}

/** Library drills label: "Taekwondo Drills" → "Karate Drills" / "Drills". */
export function drillsLabel(sportSlug: string | null | undefined, t: T, locale?: Locale): string {
  const p = getSportProfile(sportSlug);
  if (p.slug === "taekwondo") return t("libDrillsLabel");
  if (p.slug === "fitness") return t("drillsGeneric");
  return `${sportName(p.slug, locale)}-${t("drillsGeneric").toLowerCase()}`;
}

/** Hint under the discipline picker. */
export function disciplineHintFor(sportSlug: string | null | undefined, t: T): string {
  const p = getSportProfile(sportSlug);
  if (p.slug === "taekwondo") return t("disciplineHint");
  return t("disciplineHintGeneric");
}
