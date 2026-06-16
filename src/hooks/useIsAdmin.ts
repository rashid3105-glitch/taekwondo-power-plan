import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns whether the current user has the 'admin' role in user_roles.
 * Uses the existing `is_admin` RPC (same pattern as Dashboard / Help / AdminBlog).
 *
 * TODO: health-sync skjult indtil native HealthKit (RN) er klar — vis for admin indtil da.
 * Dette hook bruges også som `canSeeHealthSync`-tjek flere steder. Når health-sync
 * skal åbnes for alle igen, fjern `useIsAdmin`-gates omkring health-UI.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) { setIsAdmin(false); setLoading(false); }
        return;
      }
      const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (mounted) {
        setIsAdmin(Boolean(data));
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { isAdmin, loading };
}
