// Team test session CRUD helpers (coach side).
import { supabase } from "@/integrations/supabase/client";

export interface TeamTestSession {
  id: string;
  club_id: string;
  coach_id: string;
  name: string;
  session_date: string;
  entry_mode: "guided" | "grid";
  focus_areas: string[];
  notes: string;
  status: "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

export interface TeamTestSessionTest {
  id: string;
  session_id: string;
  test_id: string;
  test_name: string;
  order_index: number;
}

export interface TeamTestSessionAthlete {
  session_id: string;
  athlete_id: string;
}

export interface CreateSessionInput {
  club_id: string;
  coach_id: string;
  name: string;
  session_date: string;
  entry_mode: "guided" | "grid";
  focus_areas: string[];
  notes?: string;
  tests: Array<{ test_id: string; test_name: string }>;
  athlete_ids: string[];
}

export async function createTeamTestSession(input: CreateSessionInput): Promise<string> {
  const { data: session, error } = await supabase
    .from("team_test_sessions" as any)
    .insert({
      club_id: input.club_id,
      coach_id: input.coach_id,
      name: input.name,
      session_date: input.session_date,
      entry_mode: input.entry_mode,
      focus_areas: input.focus_areas,
      notes: input.notes ?? "",
      status: "in_progress",
    } as any)
    .select("id")
    .single();
  if (error || !session) throw error ?? new Error("create_failed");
  const sessionId = (session as any).id as string;

  if (input.tests.length > 0) {
    const { error: tErr } = await supabase.from("team_test_session_tests" as any).insert(
      input.tests.map((t, i) => ({
        session_id: sessionId,
        test_id: t.test_id,
        test_name: t.test_name,
        order_index: i,
      })) as any,
    );
    if (tErr) throw tErr;
  }

  if (input.athlete_ids.length > 0) {
    const { error: aErr } = await supabase.from("team_test_session_athletes" as any).insert(
      input.athlete_ids.map((id) => ({ session_id: sessionId, athlete_id: id })) as any,
    );
    if (aErr) throw aErr;
  }
  return sessionId;
}

export async function listSessionsForClub(clubId: string): Promise<TeamTestSession[]> {
  const { data, error } = await supabase
    .from("team_test_sessions" as any)
    .select("*")
    .eq("club_id", clubId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TeamTestSession[];
}

export async function getSession(sessionId: string): Promise<{
  session: TeamTestSession;
  tests: TeamTestSessionTest[];
  athletes: TeamTestSessionAthlete[];
}> {
  const [s, t, a] = await Promise.all([
    supabase.from("team_test_sessions" as any).select("*").eq("id", sessionId).single(),
    supabase
      .from("team_test_session_tests" as any)
      .select("*")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true }),
    supabase.from("team_test_session_athletes" as any).select("*").eq("session_id", sessionId),
  ]);
  if (s.error) throw s.error;
  return {
    session: s.data as unknown as TeamTestSession,
    tests: (t.data ?? []) as unknown as TeamTestSessionTest[],
    athletes: (a.data ?? []) as unknown as TeamTestSessionAthlete[],
  };
}

export async function markSessionCompleted(sessionId: string, completed: boolean) {
  const { error } = await supabase
    .from("team_test_sessions" as any)
    .update({ status: completed ? "completed" : "in_progress" } as any)
    .eq("id", sessionId);
  if (error) throw error;
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase.from("team_test_sessions" as any).delete().eq("id", sessionId);
  if (error) throw error;
}

export async function listSessionResults(sessionId: string) {
  const { data, error } = await supabase
    .from("physical_test_results" as any)
    .select("id, user_id, test_name, value, unit, category, test_date")
    .eq("session_id", sessionId);
  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    test_name: string;
    value: number;
    unit: string;
    category: string;
    test_date: string;
  }>;
}
