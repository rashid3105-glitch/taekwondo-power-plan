import type { Exercise, ExerciseCategory } from "@/data/exercises";

export type ExerciseGoal = "speed" | "power" | "rfd" | "mobility" | "strength";
export type RiskLevel = "low" | "medium" | "high";

// Map category → primary goal (presentation-only derivation)
const CATEGORY_TO_GOAL: Record<ExerciseCategory, ExerciseGoal> = {
  power: "power",
  plyometric: "rfd",
  speed: "speed",
  strength: "strength",
  mobility: "mobility",
};

// Exercise IDs that fit a secondary goal (allows multi-goal filtering)
const SECONDARY_GOALS: Record<string, ExerciseGoal[]> = {
  "hang-clean-pull": ["rfd"],
  "trap-bar-deadlift": ["rfd"],
  "kettlebell-swing": ["rfd"],
  "box-jumps": ["power", "speed"],
  "depth-jump-sprint": ["power", "speed"],
  "ankle-hops": ["speed"],
  "med-ball-rotational-throw": ["power"],
  "jump-lunge": ["power"],
  "lateral-bound-hold": ["power"],
  "banded-hip-flexor-drive": ["speed"],
};

export function getExerciseGoals(ex: Exercise): ExerciseGoal[] {
  const primary = CATEGORY_TO_GOAL[ex.category];
  const secondary = SECONDARY_GOALS[ex.id] ?? [];
  return Array.from(new Set([primary, ...secondary]));
}

// Risk inferred from category + specific high-impact exercises
const HIGH_RISK_IDS = new Set([
  "depth-jump-sprint",
  "nordic-curl",
  "pistol-squat-negative",
  "hang-clean-pull",
  "turkish-get-up",
]);

const MEDIUM_RISK_IDS = new Set([
  "box-jumps",
  "jump-lunge",
  "lateral-bound-hold",
  "trap-bar-deadlift",
  "barbell-hip-thrust",
  "kettlebell-swing",
  "bulgarian-split-squat",
  "med-ball-rotational-throw",
  "single-leg-rdl",
  "eccentric-calf-raise",
  "copenhagen-plank",
]);

export function getRiskLevel(ex: Exercise): RiskLevel {
  if (HIGH_RISK_IDS.has(ex.id)) return "high";
  if (MEDIUM_RISK_IDS.has(ex.id)) return "medium";
  if (ex.category === "plyometric" || ex.category === "power") return "medium";
  return "low";
}

export const RISK_STYLES: Record<RiskLevel, string> = {
  low: "bg-tab-progress/15 text-tab-progress border-tab-progress/30",
  medium: "bg-explosive/15 text-explosive border-explosive/30",
  high: "bg-destructive/15 text-destructive border-destructive/30",
};
