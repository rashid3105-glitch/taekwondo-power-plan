// React hook providing offline-cached access to the user's active training plan.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedPlan, setCachedPlan } from "@/lib/planOfflineDB";

export function useOfflinePlan() {
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        const active = (data as any[]).find((p) => p.is_active) || null;
        if (active) {
          setPlan(active);
          setCachedAt(Date.now());
          await setCachedPlan(user.id, active);
          setLoading(false);
          return;
        }
      }
    }

    const cached = await getCachedPlan(user.id);
    if (cached) {
      setPlan(cached.plan);
      setCachedAt(cached.saved_at);
    } else {
      setPlan(null);
      setCachedAt(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUp = () => { setOnline(true); void refresh(); };
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, [refresh]);

  return { plan, loading, online, cachedAt };
}
