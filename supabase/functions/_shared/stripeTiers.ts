// Single source of truth for Stripe product -> internal tier + athlete cap.
// Used by check-subscription (fallback polling) and stripe-webhook (push).
export interface TierInfo {
  tier: string;
  maxAthletes: number;
}

export const PRODUCT_TIER_MAP: Record<string, TierInfo> = {
  // 2026 club licences (yearly, DKK)
  prod_V5HoMRxckpTPcf: { tier: "club", maxAthletes: 50 },
  prod_V5HoWT93Bfbukz: { tier: "club_plus", maxAthletes: 100 },
  // Legacy (grandfathered)
  prod_UQuIZRc7eLMmE0: { tier: "athlete", maxAthletes: 1 },
  prod_UQuIKmqozCZzN0: { tier: "coach_solo", maxAthletes: 0 },
  prod_UQuIXPiWckbl4r: { tier: "team_small", maxAthletes: 5 },
  prod_UQuI9cf28z44Af: { tier: "team_medium", maxAthletes: 15 },
  prod_UQuIQvV9maNhXb: { tier: "team_large", maxAthletes: 25 },
  prod_UNmxepUc1kEm0x: { tier: "athlete", maxAthletes: 1 },
  prod_UNmxvBF3VPxR8F: { tier: "athlete", maxAthletes: 1 },
  prod_UNmxLjXYQZjVx8: { tier: "coach_solo", maxAthletes: 0 },
  prod_UNmx6gu55G7X61: { tier: "coach_solo", maxAthletes: 0 },
  prod_UNmxNDy5xrs57e: { tier: "team_small", maxAthletes: 5 },
  prod_UNmxmSA5vcR8YF: { tier: "team_small", maxAthletes: 5 },
  prod_UNmx2hMlzBk4lQ: { tier: "team_medium", maxAthletes: 15 },
  prod_UNmxCljnNNwjAE: { tier: "team_medium", maxAthletes: 15 },
  prod_UNmxTKbskuXAIB: { tier: "team_large", maxAthletes: 25 },
  prod_UNmxyBA46pSNcK: { tier: "team_large", maxAthletes: 25 },
};

/** Legacy fallback: unknown product = single-athlete entitlement. */
export function tierForProduct(productId: string | null | undefined): TierInfo {
  if (productId && PRODUCT_TIER_MAP[productId]) return PRODUCT_TIER_MAP[productId];
  return { tier: "athlete", maxAthletes: 1 };
}
