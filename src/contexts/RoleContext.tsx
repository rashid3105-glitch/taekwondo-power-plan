import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClub } from "./ActiveClubContext";

export type Role = "athlete" | "coach";

type RoleContextValue = {
  role: Role;
  hasCoachRole: boolean;
  hasAthleteRole: boolean;
  /** True when the user has coach (or admin) access but no athlete role — pure coach/admin accounts. */
  coachOnly: boolean;
  loading: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [profileRole, setProfileRole] = useState<Role>("athlete");
  const [profileHasCoach, setProfileHasCoach] = useState(false);
  const [hasAthleteRole, setHasAthleteRole] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const { memberships, activeMembership, loading: clubLoading } = useActiveClub();

  const loadFromProfile = useCallback(async (userId: string) => {
    const [{ data, error }, athleteCheck] = await Promise.all([
      supabase
        .from("profiles")
        .select("role, roles")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.rpc("has_role", { _user_id: userId, _role: "athlete" as any }),
    ]);

    if (!error && data) {
      const r = ((data as any).role as string | null) ?? "athlete";
      setProfileRole(r === "coach" ? "coach" : "athlete");
      const roles = ((data as any).roles as string[] | null) ?? [];
      setProfileHasCoach(r === "coach" || (Array.isArray(roles) && roles.includes("coach")));
    }
    // Default to true on failure so we never accidentally hide athlete UI for normal users.
    setHasAthleteRole(athleteCheck.error ? true : !!athleteCheck.data);
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
        setHasAthleteRole(true);
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

  const coachOnly = hasCoachRole && !hasAthleteRole;

  return (
    <RoleContext.Provider value={{ role, hasCoachRole, hasAthleteRole, coachOnly, loading: profileLoading || clubLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: "athlete" as Role, hasCoachRole: false, hasAthleteRole: true, coachOnly: false, loading: false };
  return ctx;
}
