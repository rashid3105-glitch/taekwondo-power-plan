import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tier,
  LockedModule,
  PlanType,
  isModuleLocked as isLockedFn,
  canCreatePlan as canCreateFn,
  canManageAthletes as canManageFn,
  getPlanLimit,
} from "@/lib/entitlements";

interface EntitlementState {
  tier: Tier;
  loading: boolean;
  isLocked: (module: LockedModule) => boolean;
  canCreatePlan: (type: PlanType, currentActiveCount: number) => boolean;
  canManageAthletes: () => boolean;
  planLimit: (type: PlanType) => number | null;
  refresh: () => Promise<void>;
}

let cachedTier: Tier | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60s

export function useEntitlements(): EntitlementState {
  const [tier, setTier] = useState<Tier>(cachedTier ?? "free");
  const [loading, setLoading] = useState(!cachedTier);

  const fetchTier = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        cachedTier = "free";
        cachedAt = Date.now();
        setTier("free");
        return;
      }

      // Check admin role first
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (roles?.some((r) => r.role === "admin")) {
        cachedTier = "admin";
        cachedAt = Date.now();
        setTier("admin");
        return;
      }

      // Check demo / payment status from profile
      const { data: protectedFields } = await supabase.rpc("get_profile_protected_fields", {
        _user_id: session.user.id,
      });
      const pf = protectedFields?.[0];

      // Active demo with full access counts as full team-large equivalent
      if (pf?.is_demo && pf?.demo_full_access) {
        cachedTier = "demo";
        cachedAt = Date.now();
        setTier("demo");
        return;
      }

      // Check Stripe subscription
      try {
        const { data } = await supabase.functions.invoke("check-subscription");
        if (data?.subscribed && data?.tier) {
          const t = data.tier as Tier;
          cachedTier = t;
          cachedAt = Date.now();
          setTier(t);
          return;
        }
      } catch {
        // ignore — fall through
      }

      // Restricted demo (no full access) or unpaid → free
      if (pf?.is_demo) {
        cachedTier = "athlete"; // restricted demo gets athlete-level access
        cachedAt = Date.now();
        setTier("athlete");
        return;
      }

      cachedTier = "free";
      cachedAt = Date.now();
      setTier("free");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedTier && Date.now() - cachedAt < CACHE_TTL_MS) {
      setTier(cachedTier);
      setLoading(false);
      return;
    }
    fetchTier();
  }, []);

  return {
    tier,
    loading,
    isLocked: (module) => isLockedFn(tier, module),
    canCreatePlan: (type, count) => canCreateFn(tier, type, count),
    canManageAthletes: () => canManageFn(tier),
    planLimit: (type) => getPlanLimit(tier, type),
    refresh: async () => {
      cachedTier = null;
      cachedAt = 0;
      await fetchTier();
    },
  };
}
