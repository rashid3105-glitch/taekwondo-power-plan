import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fixed 18-year product-safety threshold for numeric nutrition/weight targets.
 * NOT the GDPR Art. 8 consent age (that one is country-dependent — see
 * consent_age_for_athlete). Mirrors public.is_minor() and fails CLOSED:
 * while loading, on error, or when the age is unknown the user counts as a minor.
 */
export function useIsMinor(userId?: string | null) {
  const [isMinor, setIsMinor] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let id = userId ?? null;
        if (!id) {
          const { data } = await supabase.auth.getUser();
          id = data.user?.id ?? null;
        }
        if (!id) {
          if (!cancelled) { setIsMinor(true); setLoading(false); }
          return;
        }
        const { data, error } = await supabase.rpc("is_minor", { _user_id: id });
        if (!cancelled) {
          setIsMinor(error ? true : data !== false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setIsMinor(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { isMinor, loading };
}
