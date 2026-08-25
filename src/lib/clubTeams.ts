import { supabase } from "@/integrations/supabase/client";

export interface ClubTeam {
  id: string;
  club_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  external_ref: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ClubTeamMemberRow {
  team_id: string;
  user_id: string;
}

const TEAMS = "club_teams" as any;
const MEMBERS = "club_team_members" as any;

export async function listClubTeams(clubId: string): Promise<ClubTeam[]> {
  const { data, error } = await supabase
    .from(TEAMS)
    .select("*")
    .eq("club_id", clubId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ClubTeam[];
}

export async function listTeamMembers(teamIds: string[]): Promise<ClubTeamMemberRow[]> {
  if (teamIds.length === 0) return [];
  const { data, error } = await supabase
    .from(MEMBERS)
    .select("team_id, user_id")
    .in("team_id", teamIds);
  if (error) throw error;
  return (data ?? []) as unknown as ClubTeamMemberRow[];
}

export async function listTeamsForAthlete(userId: string): Promise<ClubTeam[]> {
  const { data, error } = await supabase
    .from(MEMBERS)
    .select("team_id, club_teams:team_id(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data ?? []) as any[])
    .map((r) => r.club_teams as ClubTeam)
    .filter((t): t is ClubTeam => !!t && t.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export async function createClubTeam(
  clubId: string,
  name: string,
  description: string | null,
  sortOrder: number,
): Promise<ClubTeam> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from(TEAMS)
    .insert({
      club_id: clubId,
      name: name.trim(),
      description: description?.trim() || null,
      sort_order: sortOrder,
      created_by: user?.id ?? null,
    } as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ClubTeam;
}

export async function updateClubTeam(
  id: string,
  patch: Partial<Pick<ClubTeam, "name" | "description" | "sort_order" | "is_active">>,
): Promise<void> {
  const { error } = await supabase.from(TEAMS).update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function addTeamMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase.from(MEMBERS).insert({ team_id: teamId, user_id: userId } as any);
  if (error) throw error;
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase.from(MEMBERS).delete().eq("team_id", teamId).eq("user_id", userId);
  if (error) throw error;
}
