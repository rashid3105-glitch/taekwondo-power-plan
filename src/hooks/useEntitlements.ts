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

// ----------------------------------------------------------------------------
// Per-athlete module access (club defaults + athlete overrides, admin-managed)
// ----------------------------------------------------------------------------

interface AthleteModuleAccessState {
  loading: boolean;
  isModuleEnabled: (module: string) => boolean;
  refresh: () => Promise<void>;
}

export function useAthleteModuleAccess(): AthleteModuleAccessState {
  const [loading, setLoading] = useState(true);
  const [clubDefaults, setClubDefaults] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setClubDefaults({});
        setOverrides({});
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const clubId = (profile as any)?.club_id ?? null;

      const [defaultsRes, overridesRes] = await Promise.all([
        clubId
          ? supabase
              .from("club_module_defaults" as any)
              .select("module, enabled")
              .eq("club_id", clubId)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("athlete_module_overrides" as any)
          .select("module, enabled")
          .eq("user_id", session.user.id),
      ]);

      const cd: Record<string, boolean> = {};
      for (const r of ((defaultsRes as any).data || []) as { module: string; enabled: boolean }[]) {
        cd[r.module] = r.enabled;
      }
      const ov: Record<string, boolean> = {};
      for (const r of ((overridesRes as any).data || []) as { module: string; enabled: boolean }[]) {
        ov[r.module] = r.enabled;
      }
      setClubDefaults(cd);
      setOverrides(ov);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    loading,
    isModuleEnabled: (module: string) => {
      if (overrides[module] !== undefined) return overrides[module];
      if (clubDefaults[module] !== undefined) return clubDefaults[module];
      return true;
    },
    refresh: load,
  };
}
