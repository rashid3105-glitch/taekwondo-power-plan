import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type RoleContextValue = {
  roles: string[];
  activeRole: string;
  setActiveRole: (role: string) => Promise<void>;
  loading: boolean;
};

const LS_KEY = "active_role";
const DEFAULT_ROLE = "athlete";

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<string[]>([DEFAULT_ROLE]);
  const [activeRole, setActiveRoleState] = useState<string>(
    () => (typeof window !== "undefined" && localStorage.getItem(LS_KEY)) || DEFAULT_ROLE
  );
  const [loading, setLoading] = useState(true);

  const loadFromProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("roles, active_role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const r = (data.roles as string[] | null) ?? [DEFAULT_ROLE];
      const a = (data.active_role as string | null) ?? r[0] ?? DEFAULT_ROLE;
      setRoles(r.length ? r : [DEFAULT_ROLE]);
      setActiveRoleState(a);
      try { localStorage.setItem(LS_KEY, a); } catch {}
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
        setRoles([DEFAULT_ROLE]);
        setActiveRoleState(DEFAULT_ROLE);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFromProfile]);

  const setActiveRole = useCallback(async (role: string) => {
    setActiveRoleState(role);
    try { localStorage.setItem(LS_KEY, role); } catch {}
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ active_role: role })
        .eq("user_id", user.id);
    }
  }, []);

  return (
    <RoleContext.Provider value={{ roles, activeRole, setActiveRole, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within a RoleProvider");
  return ctx;
}
