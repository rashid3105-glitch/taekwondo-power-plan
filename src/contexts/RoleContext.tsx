import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClub } from "./ActiveClubContext";

export type Role = "athlete" | "coach";

type RoleContextValue = {
  role: Role;
  hasCoachRole: boolean;
  loading: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [profileRole, setProfileRole] = useState<Role>("athlete");
  const [profileHasCoach, setProfileHasCoach] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const { memberships, activeMembership, loading: clubLoading } = useActiveClub();

  const loadFromProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, roles")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const r = ((data as any).role as string | null) ?? "athlete";
      setProfileRole(r === "coach" ? "coach" : "athlete");
      const roles = ((data as any).roles as string[] | null) ?? [];
      setProfileHasCoach(r === "coach" || (Array.isArray(roles) && roles.includes("coach")));
    }
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadFromProfile(session.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        loadFromProfile(session.user.id);
      } else {
        setProfileRole("athlete");
        setProfileHasCoach(false);
        setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFromProfile]);

  // Multi-club: derive role from the active membership. Single/zero membership:
  // preserve previous behavior exactly (read from profiles.role + profiles.roles).
  let role: Role = profileRole;
  if (memberships.length > 1 && activeMembership) {
    role = activeMembership.role_in_club === "coach" || activeMembership.role_in_club === "admin"
      ? "coach"
      : "athlete";
  }

  // hasCoachRole stays true if ANY membership is coach/admin OR profile.roles includes coach.
  const hasCoachRole =
    profileHasCoach ||
    memberships.some((m) => m.role_in_club === "coach" || m.role_in_club === "admin");

  return (
    <RoleContext.Provider value={{ role, hasCoachRole, loading: profileLoading || clubLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: "athlete" as Role, hasCoachRole: false, loading: false };
  return ctx;
}
