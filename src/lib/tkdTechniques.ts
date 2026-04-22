// Taekwondo-only technique vocabulary for Match Analysis.
// Strictly TKD: no other martial arts vocabulary allowed here.

export type Discipline = "sparring" | "poomsae";

export interface TechniqueDef {
  key: string;
  labelKey: string; // i18n key
}

// WT/Olympic sparring techniques only
export const SPARRING_TECHNIQUES: TechniqueDef[] = [
  { key: "round_kick", labelKey: "tkdTechRoundKick" },         // Dollyo chagi
  { key: "back_kick", labelKey: "tkdTechBackKick" },           // Dwit chagi
  { key: "spin_hook_kick", labelKey: "tkdTechSpinHookKick" },  // Dwi huryeo chagi
  { key: "axe_kick", labelKey: "tkdTechAxeKick" },             // Naeryeo chagi
  { key: "front_kick", labelKey: "tkdTechFrontKick" },         // Ap chagi
  { key: "side_kick", labelKey: "tkdTechSideKick" },           // Yeop chagi
  { key: "push_kick", labelKey: "tkdTechPushKick" },           // Mireo chagi (cut/clinch)
  { key: "head_kick", labelKey: "tkdTechHeadKick" },           // Olgul (head-level)
  { key: "punch", labelKey: "tkdTechPunch" },                  // Jireugi (1 pt body)
  { key: "clinch", labelKey: "tkdTechClinch" },                // Clinch / break
];

// Poomsae elements (forms-only assessment)
export const POOMSAE_ELEMENTS: TechniqueDef[] = [
  { key: "stance", labelKey: "tkdPoomsaeStance" },             // Seogi
  { key: "block", labelKey: "tkdPoomsaeBlock" },               // Makgi
  { key: "strike", labelKey: "tkdPoomsaeStrike" },             // Chigi
  { key: "kick", labelKey: "tkdPoomsaeKick" },                 // Chagi
  { key: "kihap", labelKey: "tkdPoomsaeKihap" },               // Energy shout
  { key: "transition", labelKey: "tkdPoomsaeTransition" },     // Movement flow
  { key: "balance", labelKey: "tkdPoomsaeBalance" },           // Hold / posture
  { key: "rhythm", labelKey: "tkdPoomsaeRhythm" },             // Tempo & expression
];

export const techniquesFor = (discipline: Discipline): TechniqueDef[] =>
  discipline === "poomsae" ? POOMSAE_ELEMENTS : SPARRING_TECHNIQUES;

export const OUTCOMES = [
  { key: "scored", labelKey: "matchOutcomeScored" },
  { key: "conceded", labelKey: "matchOutcomeConceded" },
  { key: "penalty", labelKey: "matchOutcomePenalty" },
  { key: "none", labelKey: "matchOutcomeNone" },
] as const;

export const SIDES = [
  { key: "left", labelKey: "matchSideLeft" },
  { key: "right", labelKey: "matchSideRight" },
  { key: "n/a", labelKey: "matchSideNA" },
] as const;
