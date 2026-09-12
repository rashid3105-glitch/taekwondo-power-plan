import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Per-user opt-in for the post-training log (athlete log card + shared coach
 * queue). Off by default — the user turns it on from their profile.
 */
export function usePostTrainingLog() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setEnabled(false); return; }
        const { data } = await supabase
          .from("profiles")
          .select("training_log_v2_enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) setEnabled((data as any)?.training_log_v2_enabled === true);
      } catch {
        if (!cancelled) setEnabled(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { enabled, loading };
}
