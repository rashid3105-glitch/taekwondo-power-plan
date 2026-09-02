import { supabase } from "@/integrations/supabase/client";

/**
 * User ids of coaches/admins in a club. Their own diary posts must never show
 * up in the shared training-log queue for other coaches.
 */
export async function fetchClubStaffIds(clubId: string | null): Promise<Set<string>> {
  if (!clubId) return new Set();
  const { data } = await supabase
    .from("club_memberships")
    .select("user_id, role, status")
    .eq("club_id", clubId)
    .in("role", ["coach", "admin"]);
  return new Set(
    ((data as any[]) || [])
      .filter((m) => m.status !== "removed")
      .map((m) => m.user_id as string),
  );
}
