import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/hooks/useEntitlements";

export interface SubscriptionRow {
  user_id: string;
  tier_id: string | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const ent = useEntitlements();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSub(null); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setSub((data as SubscriptionRow) ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return {
    ...ent,
    subscription: sub,
    isActive: sub?.status === "active" || ent.tier === "demo" || ent.tier === "admin",
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    refresh: async () => { await ent.refresh(); await load(); },
  };
}
