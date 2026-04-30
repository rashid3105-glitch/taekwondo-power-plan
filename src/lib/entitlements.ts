// Centralized entitlement / module-access system based on Stripe subscription tier.
// Used to gate locked modules and enforce plan limits across the app.

export type Tier =
  | "free"
  | "athlete"
  | "coach_solo"
  | "team_small"
  | "team_medium"
  | "team_large"
  | "demo"
  | "admin";

export type LockedModule =
  | "rehab"
  | "testing"
  | "match_analysis"
  | "competitions"
  | "season_plan"
  | "library";

export type PlanType = "training" | "mental" | "nutrition";

// Modules that are LOCKED for each tier. Empty array = full access.
// "*" = everything locked (free / unpaid).
export const LOCKED_MODULES_BY_TIER: Record<Tier, LockedModule[] | ["*"]> = {
  free: ["*"],
  athlete: ["rehab", "testing", "match_analysis", "competitions", "season_plan", "library"],
  coach_solo: [],
  team_small: [],
  team_medium: [],
  team_large: [],
  demo: [],
  admin: [],
};

// Per-tier limits on the number of ACTIVE plans (training / mental / nutrition).
// `null` = unlimited.
export const PLAN_LIMITS: Record<
  Tier,
  { training: number; mental: number; nutrition: number } | null
> = {
  free: { training: 0, mental: 0, nutrition: 0 },
  athlete: { training: 1, mental: 1, nutrition: 1 },
  coach_solo: { training: 1, mental: 1, nutrition: 1 },
  team_small: null,
  team_medium: null,
  team_large: null,
  demo: null,
  admin: null,
};

export function isModuleLocked(tier: Tier, module: LockedModule): boolean {
  const locked = LOCKED_MODULES_BY_TIER[tier];
  if (!locked) return false;
  if ((locked as string[]).includes("*")) return true;
  return (locked as string[]).includes(module);
}

export function getPlanLimit(tier: Tier, planType: PlanType): number | null {
  const limits = PLAN_LIMITS[tier];
  if (limits === null) return null; // unlimited
  return limits[planType];
}

export function canCreatePlan(
  tier: Tier,
  planType: PlanType,
  currentActiveCount: number
): boolean {
  const limit = getPlanLimit(tier, planType);
  if (limit === null) return true;
  return currentActiveCount < limit;
}

export function canManageAthletes(tier: Tier): boolean {
  return tier === "team_small" || tier === "team_medium" || tier === "team_large" || tier === "admin";
}
