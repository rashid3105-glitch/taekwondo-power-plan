import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSportProfile, type SportProfile } from "@/config/sportProfiles";

/**
 * PREVIEW hook — resolves the sport profile for a club.
 * Falls back to taekwondo, so existing clubs behave exactly as before.
 */
export function useSportProfile(clubId?: string | null) {
  const [profile, setProfile] = useState<SportProfile>(getSportProfile(null));
  const [loading, setLoading] = useState(!!clubId);

  useEffect(() => {
    let cancelled = false;
    if (!clubId) {
      setProfile(getSportProfile(null));
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("clubs" as any)
        .select("sport")
        .eq("id", clubId)
        .maybeSingle();
      if (cancelled) return;
      setProfile(getSportProfile((data as any)?.sport));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  return { profile, loading };
}
