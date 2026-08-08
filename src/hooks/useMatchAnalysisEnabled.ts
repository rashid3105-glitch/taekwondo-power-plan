import { useMySportProfile } from "./useMySportProfile";
import { useSportProfile } from "./useSportProfile";

/**
 * Match Analysis is taekwondo-only for now: the technique vocabulary behind it
 * (src/lib/tkdTechniques.ts) is strictly TKD. Sports whose profile has
 * `hasMatchAnalysis: false` must not see the entry points at all.
 */
export function useMatchAnalysisEnabled() {
  const { profile, loading } = useMySportProfile();
  return { matchAnalysisEnabled: profile.hasMatchAnalysis, loading };
}

/** Same check for a specific club (coach views on another athlete's club). */
export function useClubMatchAnalysisEnabled(clubId?: string | null) {
  const { profile, loading } = useSportProfile(clubId ?? null);
  return { matchAnalysisEnabled: profile.hasMatchAnalysis, loading };
}
