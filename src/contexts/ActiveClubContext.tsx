import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ClubRole = "athlete" | "coach" | "admin";

export type ClubMembership = {
  club_id: string;
  club_name: string;
  role_in_club: ClubRole;
  status: string;
};

type ActiveClubContextValue = {
  memberships: ClubMembership[];
  activeClubId: string | null;
  activeMembership: ClubMembership | null;
  setActiveClubId: (id: string) => void;
  loading: boolean;
};

const ActiveClubContext = createContext<ActiveClubContextValue | undefined>(undefined);

const STORAGE_PREFIX = "activeClubId:";

export function ActiveClubProvider({ children }: { children: ReactNode }) {
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadFor = useCallback(async (userId: string) => {
    // Pull active memberships + club names + the user's primary club for fallback ordering.
    const [membershipsRes, profileRes] = await Promise.all([
      supabase
        .from("club_memberships" as any)
        .select("club_id, role_in_club, status, clubs:club_id ( name )")
        .eq("user_id", userId)
        .eq("status", "active"),
      supabase
        .from("profiles")
        .select("club_id, role")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const rawRows = ((membershipsRes.data as any[]) ?? []);
    const list: ClubMembership[] = rawRows
      .map((r) => ({
        club_id: r.club_id as string,
        club_name: (r.clubs?.name as string) ?? "",
        role_in_club: ((r.role_in_club as string) === "coach" || (r.role_in_club as string) === "admin")
          ? (r.role_in_club as ClubRole)
          : "athlete",
        status: r.status as string,
      }))
      .sort((a, b) => a.club_name.localeCompare(b.club_name));

    const profile = (profileRes.data as any) ?? null;
    const primaryClubId: string | null = profile?.club_id ?? null;
    const profileRole: string | null = profile?.role ?? null;

    // Pick active club:
    // 1) localStorage if still valid
    // 2) only membership if length === 1
    // 3) matches profiles.club_id
    // 4) first alphabetically
    let next: string | null = null;
    if (list.length > 0) {
      const stored = typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_PREFIX + userId)
        : null;
      if (stored && list.some((m) => m.club_id === stored)) {
        next = stored;
      } else if (list.length === 1) {
        next = list[0].club_id;
      } else if (primaryClubId && list.some((m) => m.club_id === primaryClubId)) {
        next = primaryClubId;
      } else {
        next = list[0].club_id;
      }
    }

    // Dev-only selvtest: single-member should match profiles.role
    if (
      list.length === 1 &&
      profileRole &&
      ((profileRole === "coach" && list[0].role_in_club === "athlete") ||
        (profileRole === "athlete" && (list[0].role_in_club === "coach" || list[0].role_in_club === "admin")))
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ActiveClubContext] Single-member role mismatch: profile.role =",
        profileRole,
        "but membership.role_in_club =",
        list[0].role_in_club,
      );
    }

    if (list.length === 0 && primaryClubId) {
      // eslint-disable-next-line no-console
      console.warn(
        "[ActiveClubContext] No club_memberships rows for user — falling back to profiles.club_id.",
      );
    }

    setMemberships(list);
    setActiveClubIdState(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    let currentUserId: string | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        currentUserId = session.user.id;
        loadFor(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        if (session.user.id !== currentUserId) {
          currentUserId = session.user.id;
          setLoading(true);
          loadFor(session.user.id);
        }
      } else {
        currentUserId = null;
        setMemberships([]);
        setActiveClubIdState(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFor]);

  const setActiveClubId = useCallback((id: string) => {
    setActiveClubIdState(id);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_PREFIX + user.id, id);
      }
    });
  }, []);

  const activeMembership = memberships.find((m) => m.club_id === activeClubId) ?? null;

  return (
    <ActiveClubContext.Provider
      value={{ memberships, activeClubId, activeMembership, setActiveClubId, loading }}
    >
      {children}
    </ActiveClubContext.Provider>
  );
}

export function useActiveClub() {
  const ctx = useContext(ActiveClubContext);
  if (!ctx) {
    return {
      memberships: [] as ClubMembership[],
      activeClubId: null,
      activeMembership: null,
      setActiveClubId: () => {},
      loading: false,
    };
  }
  return ctx;
}
