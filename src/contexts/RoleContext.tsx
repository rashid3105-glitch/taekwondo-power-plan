import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "athlete" | "coach";

type RoleContextValue = {
  role: Role;
  hasCoachRole: boolean;
  loading: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("athlete");
  const [hasCoachRole, setHasCoachRole] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFromProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, roles")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const r = ((data as any).role as string | null) ?? "athlete";
      setRole(r === "coach" ? "coach" : "athlete");
      const roles = ((data as any).roles as string[] | null) ?? [];
      setHasCoachRole(r === "coach" || (Array.isArray(roles) && roles.includes("coach")));
    }
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
        setHasCoachRole(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFromProfile]);

  return (
    <RoleContext.Provider value={{ role, hasCoachRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: "athlete" as Role, hasCoachRole: false, loading: false };
  return ctx;
}
