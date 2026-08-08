/**
 * Sport profiles (PREVIEW).
 *
 * Phase 1 of the sport-agnostic roadmap: a read-only, client-side taxonomy that
 * describes each supported sport. Nothing in the live app reads this yet — it is
 * consumed by the admin preview page (/admin/sport-preview) only, so existing
 * behaviour is untouched. Later phases will move this into the database and let
 * the rest of the UI read labels from here instead of hardcoded TKD terms.
 */

export type SportSlug = "taekwondo" | "karate" | "kickboxing" | "fitness";

export interface SportProfile {
  slug: SportSlug;
  /** Display name per locale-agnostic default (Danish); i18n keys come in phase 5. */
  name: string;
  nameEn: string;
  /** Label used where the app today says "Bælte" / "belt_level". */
  gradeLabel: string;
  gradeLabelEn: string;
  /** Ordered grade ladder, lowest first. Empty = sport has no formal grading. */
  grades: string[];
  /** Label used where the app today says "Teknikker". */
  skillLabel: string;
  skillLabelEn: string;
  /** Seed skill taxonomy, grouped by category. */
  skillGroups: { group: string; skills: string[] }[];
  /** Competition formats (drives match analysis + competition module). */
  competitionFormats: string[];
  /** Physical test battery keys (existing tests in src/lib/testCatalog.ts stay shared). */
  testBattery: string[];
  /** Term overrides for session/plan wording. */
  sessionLabel: string;
  sessionLabelEn: string;
  /** Whether the sport has a match/bout analysis module. */
  hasMatchAnalysis: boolean;
}

export const SPORT_PROFILES: Record<SportSlug, SportProfile> = {
  taekwondo: {
    slug: "taekwondo",
    name: "Taekwondo",
    nameEn: "Taekwondo",
    gradeLabel: "Bælte",
    gradeLabelEn: "Belt",
    grades: [
      "10. kup (hvid)",
      "9. kup (hvid/gul)",
      "8. kup (gul)",
      "7. kup (gul/grøn)",
      "6. kup (grøn)",
      "5. kup (grøn/blå)",
      "4. kup (blå)",
      "3. kup (blå/rød)",
      "2. kup (rød)",
      "1. kup (rød/sort)",
      "1. dan",
      "2. dan",
      "3. dan",
      "4. dan",
    ],
    skillLabel: "Teknikker",
    skillLabelEn: "Techniques",
    skillGroups: [
      { group: "Spark", skills: ["Dollyo chagi", "Naeryo chagi", "Yop chagi", "Dwi chagi", "Bandal chagi", "Momdollyo chagi"] },
      { group: "Hånd", skills: ["Jireugi (stød)", "Momtong makgi", "Are makgi"] },
      { group: "Kamp-taktik", skills: ["Kontraangreb", "Fodarbejde", "Clinch-håndtering", "Pointføring"] },
      { group: "Poomsae", skills: ["Taegeuk 1-8", "Koryo", "Keumgang", "Taebaek"] },
    ],
    competitionFormats: ["Kamp (kyorugi)", "Poomsae"],
    testBattery: ["sprint_10m", "cmj", "sit_and_reach", "yoyo", "kick_frequency", "core_endurance"],
    sessionLabel: "Taekwondo-træning",
    sessionLabelEn: "Taekwondo session",
    hasMatchAnalysis: true,
  },
  karate: {
    slug: "karate",
    name: "Karate",
    nameEn: "Karate",
    gradeLabel: "Bælte",
    gradeLabelEn: "Belt",
    grades: [
      "9. kyu (hvid)",
      "8. kyu (gul)",
      "7. kyu (orange)",
      "6. kyu (grøn)",
      "5. kyu (blå)",
      "4. kyu (lilla)",
      "3. kyu (brun)",
      "2. kyu (brun)",
      "1. kyu (brun)",
      "1. dan",
      "2. dan",
      "3. dan",
    ],
    skillLabel: "Teknikker",
    skillLabelEn: "Techniques",
    skillGroups: [
      { group: "Slag (tsuki)", skills: ["Gyaku-zuki", "Kizami-zuki", "Oi-zuki", "Ura-zuki"] },
      { group: "Spark (geri)", skills: ["Mae-geri", "Mawashi-geri", "Yoko-geri", "Ushiro-geri"] },
      { group: "Blokeringer (uke)", skills: ["Gedan-barai", "Age-uke", "Soto-uke", "Uchi-uke"] },
      { group: "Kata", skills: ["Heian 1-5", "Bassai Dai", "Kanku Dai", "Empi"] },
    ],
    competitionFormats: ["Kumite", "Kata"],
    testBattery: ["sprint_10m", "cmj", "sit_and_reach", "yoyo", "core_endurance"],
    sessionLabel: "Karate-træning",
    sessionLabelEn: "Karate session",
    // Match analysis is taekwondo-only until karate-specific technique
    // vocabulary exists (see src/lib/tkdTechniques.ts).
    hasMatchAnalysis: false,
  },
  kickboxing: {
    slug: "kickboxing",
    name: "Kickboxing",
    nameEn: "Kickboxing",
    gradeLabel: "Niveau",
    gradeLabelEn: "Level",
    grades: [
      "Begynder",
      "Let øvet",
      "Øvet",
      "Klubkonkurrence",
      "Nationalt niveau",
      "Landshold",
      "Elite/senior A",
    ],
    skillLabel: "Færdigheder",
    skillLabelEn: "Skills",
    skillGroups: [
      { group: "Hænder", skills: ["Jab", "Cross", "Hook", "Uppercut", "Overhand"] },
      { group: "Spark", skills: ["Roundhouse", "Front kick (teep)", "Side kick", "Spinning back kick", "Low kick"] },
      { group: "Forsvar", skills: ["Slip", "Parade", "Check", "Footwork/exit", "Clinch"] },
      { group: "Kombinationer", skills: ["1-2-low kick", "Jab-hook-roundhouse", "Counter off jab"] },
    ],
    competitionFormats: ["Full contact", "Light contact", "K1", "Point fighting"],
    testBattery: ["sprint_10m", "cmj", "yoyo", "core_endurance", "grip_strength"],
    sessionLabel: "Kickboxing-træning",
    sessionLabelEn: "Kickboxing session",
    // Match analysis is taekwondo-only until kickboxing-specific technique
    // vocabulary exists (see src/lib/tkdTechniques.ts).
    hasMatchAnalysis: false,
  },
  fitness: {
    slug: "fitness",
    name: "Generel fitness",
    nameEn: "General fitness",
    gradeLabel: "Træningsniveau",
    gradeLabelEn: "Training level",
    grades: ["Nybegynder", "Let øvet", "Øvet", "Avanceret", "Elite"],
    skillLabel: "Øvelsesfokus",
    skillLabelEn: "Focus areas",
    skillGroups: [
      { group: "Styrke", skills: ["Squat", "Dødløft", "Bænkpres", "Pull-up", "Overhead press"] },
      { group: "Kondition", skills: ["Intervalløb", "Steady state", "Roning", "Cykling"] },
      { group: "Mobilitet", skills: ["Hofte", "Skulder", "Ankel", "Thorakal"] },
      { group: "Eksplosivitet", skills: ["Boks-hop", "Med-ball kast", "Sprint"] },
    ],
    competitionFormats: [],
    testBattery: ["sprint_10m", "cmj", "sit_and_reach", "yoyo", "grip_strength", "core_endurance"],
    sessionLabel: "Træningspas",
    sessionLabelEn: "Training session",
    hasMatchAnalysis: false,
  },
};

export const SPORT_ORDER: SportSlug[] = ["taekwondo", "karate", "kickboxing", "fitness"];

export const DEFAULT_SPORT: SportSlug = "taekwondo";

export function getSportProfile(slug?: string | null): SportProfile {
  const key = (slug || "").trim().toLowerCase() as SportSlug;
  return SPORT_PROFILES[key] ?? SPORT_PROFILES[DEFAULT_SPORT];
}
