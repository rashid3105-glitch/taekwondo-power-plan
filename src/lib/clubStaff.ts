import { supabase } from "@/integrations/supabase/client";

/**
 * User ids of coaches/admins in a club. Their own diary posts must never show
 * up in the shared training-log queue for other coaches.
 */
export async function fetchClubStaffIds(clubId: string | null): Promise<Set<string>> {
  if (!clubId) return new Set();
  const { data, error } = await (supabase as any)
    .from("club_memberships")
    .select("user_id, role_in_club, status")
    .eq("club_id", clubId)
    .in("role_in_club", ["coach", "admin"]);

  if (error) {
    console.error("fetchClubStaffIds failed", error);
    return new Set();
  }

  return new Set(
    ((data as any[]) || [])
      .filter((m) => m.status !== "removed")
      .map((m) => m.user_id as string),
  );
}
