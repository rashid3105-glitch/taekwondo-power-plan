import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hidden feature gate for in-progress features that are live-tested in
 * production. Only platform superadmins get `labEnabled === true`; every
 * other user never sees the surface at all.
 */
export function useSuperadminLab() {
  const [labEnabled, setLabEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) { setLabEnabled(false); setLoading(false); } return; }
        // Platform admins only — independent of the superadmin read-access
        // toggle, so the lab stays reachable while testing normally.
        const { data } = await supabase.rpc("is_admin", { _user_id: user.id } as any);
        if (!cancelled) setLabEnabled(data === true);
      } catch {
        if (!cancelled) setLabEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { labEnabled, loading };
}
