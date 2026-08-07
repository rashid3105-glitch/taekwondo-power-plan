import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useSportProfile } from "./useSportProfile";

/**
 * Convenience hook: resolve the sport profile for the current user's active club.
 *
 * Falls back to taekwondo when there is no active club (e.g. during onboarding
 * before the athlete has joined a club), so existing TKD-only behaviour is
 * preserved unchanged.
 */
export function useMySportProfile() {
  const { activeClubId } = useActiveClub();
  return useSportProfile(activeClubId);
}
