// Server copy of src/config/sportProfiles.ts — keep the two in sync.
// Used by generators (generate-plan) so prompts are sport-aware instead of
// hardcoded to taekwondo.

export type SportSlug = "taekwondo" | "karate" | "kickboxing" | "fitness";

export interface SportProfile {
  slug: SportSlug;
  name: string;
  nameEn: string;
  gradeLabel: string;
  gradeLabelEn: string;
  skillLabel: string;
  skillLabelEn: string;
  skillGroups: { group: string; skills: string[] }[];
  competitionFormats: string[];
  sessionLabel: string;
  sessionLabelEn: string;
  hasMatchAnalysis: boolean;
  /** Disciplines the sport distinguishes between (empty = no discipline split). */
  disciplines: { key: string; label: string; focus: string }[];
  /** Physical demands the S&C program must serve. */
  demands: string[];
}

export const SPORT_PROFILES: Record<SportSlug, SportProfile> = {
  taekwondo: {
    slug: "taekwondo",
    name: "Taekwondo",
    nameEn: "Taekwondo",
    gradeLabel: "Bælte",
    gradeLabelEn: "Belt",
    skillLabel: "Teknikker",
    skillLabelEn: "Techniques",
    skillGroups: [
      { group: "Kicks", skills: ["Dollyo chagi", "Naeryo chagi", "Yop chagi", "Dwi chagi", "Bandal chagi"] },
      { group: "Hands", skills: ["Jireugi", "Momtong makgi", "Are makgi"] },
      { group: "Fight tactics", skills: ["Counter attack", "Footwork", "Clinch handling", "Point management"] },
      { group: "Poomsae", skills: ["Taegeuk 1-8", "Koryo", "Keumgang", "Taebaek"] },
    ],
    competitionFormats: ["Sparring (kyorugi)", "Poomsae"],
    sessionLabel: "Taekwondo-træning",
    sessionLabelEn: "Taekwondo session",
    hasMatchAnalysis: true,
    disciplines: [
      {
        key: "sparring",
        label: "SPARRING (fighter)",
        focus: `- Explosive power and speed for kicks, punches, and footwork
- Rate of force development (RFD) for fast-twitch muscle activation
- Reaction time and agility drills
- Combat-specific conditioning (intervals mimicking round structure)
- Ability to absorb and deliver impact
- Quick direction changes and lateral movement`,
      },
      {
        key: "poomsae",
        label: "POOMSAE (forms)",
        focus: `- Balance, stability, and proprioception
- Controlled strength through full range of motion
- Core stability for stances and transitions
- Flexibility and mobility for aesthetic technique execution
- Muscular endurance for sustained performance
- Precision and body control over raw power
- Slow-tempo strength work for movement quality`,
      },
    ],
    demands: ["explosive kicking speed", "hip mobility for high kicks", "repeat-sprint style conditioning"],
  },
  karate: {
    slug: "karate",
    name: "Karate",
    nameEn: "Karate",
    gradeLabel: "Bælte",
    gradeLabelEn: "Belt",
    skillLabel: "Teknikker",
    skillLabelEn: "Techniques",
    skillGroups: [
      { group: "Punches (tsuki)", skills: ["Gyaku-zuki", "Kizami-zuki", "Oi-zuki"] },
      { group: "Kicks (geri)", skills: ["Mae-geri", "Mawashi-geri", "Yoko-geri", "Ushiro-geri"] },
      { group: "Blocks (uke)", skills: ["Gedan-barai", "Age-uke", "Soto-uke"] },
      { group: "Kata", skills: ["Heian 1-5", "Bassai Dai", "Kanku Dai", "Empi"] },
    ],
    competitionFormats: ["Kumite", "Kata"],
    sessionLabel: "Karate-træning",
    sessionLabelEn: "Karate session",
    // Taekwondo-only feature for now — no karate technique vocabulary yet.
    hasMatchAnalysis: false,
    disciplines: [
      {
        key: "sparring",
        label: "KUMITE (fighter)",
        focus: `- Explosive linear acceleration for scoring distance
- Rate of force development and reaction speed
- Short, sharp conditioning matching kumite exchanges
- Change of direction and defensive footwork
- Trunk stiffness for punch transfer`,
      },
      {
        key: "poomsae",
        label: "KATA (forms)",
        focus: `- Balance, stability, and proprioception
- Controlled strength through full range of motion
- Deep-stance leg endurance and hip strength
- Flexibility and mobility for clean technique
- Precision and body control over raw power`,
      },
    ],
    demands: ["explosive linear entries", "deep-stance leg strength", "trunk stiffness"],
  },
  kickboxing: {
    slug: "kickboxing",
    name: "Kickboxing",
    nameEn: "Kickboxing",
    gradeLabel: "Niveau",
    gradeLabelEn: "Level",
    skillLabel: "Færdigheder",
    skillLabelEn: "Skills",
    skillGroups: [
      { group: "Hands", skills: ["Jab", "Cross", "Hook", "Uppercut", "Overhand"] },
      { group: "Kicks", skills: ["Roundhouse", "Teep", "Side kick", "Spinning back kick", "Low kick"] },
      { group: "Defence", skills: ["Slip", "Parry", "Check", "Footwork/exit", "Clinch"] },
    ],
    competitionFormats: ["Full contact", "Light contact", "K1", "Point fighting"],
    sessionLabel: "Kickboxing-træning",
    sessionLabelEn: "Kickboxing session",
    // Taekwondo-only feature for now — no kickboxing technique vocabulary yet.
    hasMatchAnalysis: false,
    disciplines: [],
    demands: [
      "repeated high-intensity rounds (2-3 min work, 1 min rest)",
      "rotational power for hooks and kicks",
      "neck, trunk and shoulder durability for impact",
      "leg endurance for stance and footwork",
    ],
  },
  fitness: {
    slug: "fitness",
    name: "Generel fitness",
    nameEn: "General fitness",
    gradeLabel: "Træningsniveau",
    gradeLabelEn: "Training level",
    skillLabel: "Øvelsesfokus",
    skillLabelEn: "Focus areas",
    skillGroups: [
      { group: "Strength", skills: ["Squat", "Deadlift", "Bench press", "Pull-up", "Overhead press"] },
      { group: "Conditioning", skills: ["Intervals", "Steady state", "Rowing", "Cycling"] },
      { group: "Mobility", skills: ["Hip", "Shoulder", "Ankle", "Thoracic"] },
      { group: "Power", skills: ["Box jump", "Med-ball throw", "Sprint"] },
    ],
    competitionFormats: [],
    sessionLabel: "Træningspas",
    sessionLabelEn: "Training session",
    hasMatchAnalysis: false,
    disciplines: [],
    demands: [
      "balanced full-body strength development",
      "aerobic base and work capacity",
      "joint health and mobility",
      "sustainable progression the athlete can keep up long term",
    ],
  },
};

export const DEFAULT_SPORT: SportSlug = "taekwondo";

export function getSportProfile(slug?: string | null): SportProfile {
  const key = (slug || "").trim().toLowerCase() as SportSlug;
  return SPORT_PROFILES[key] ?? SPORT_PROFILES[DEFAULT_SPORT];
}
