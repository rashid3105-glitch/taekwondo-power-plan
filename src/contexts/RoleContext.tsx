import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "athlete" | "coach";

type RoleContextValue = {
  role: Role;
  loading: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("athlete");
  const [loading, setLoading] = useState(true);

  const loadFromProfile = useCallback(async (userId: string) => {
    // Coach role lives in user_roles (profiles.role is unreliable). Check both for safety.
    const [{ data: rolesRows }, { data: profileRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle(),
    ]);
    const isCoach =
      (rolesRows?.some((r: any) => r.role === "coach" || r.role === "admin") ?? false) ||
      (profileRow as any)?.role === "coach";
    setRole(isCoach ? "coach" : "athlete");
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadFromProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        loadFromProfile(session.user.id);
      } else {
        setRole("athlete");
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFromProfile]);

  return (
    <RoleContext.Provider value={{ role, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
