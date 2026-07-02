import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;
    const athleteId = body.athlete_id as string | undefined;
    if (!athleteId || typeof athleteId !== "string") return json({ error: "athlete_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Permission check: admin OR currently-assigned coach OR coach+same club as athlete
    const [{ data: rolesRows }, { data: athleteProfile }, { data: callerProfile }, { data: currentLink }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", callerId),
      admin.from("profiles").select("club_id").eq("user_id", athleteId).maybeSingle(),
      admin.from("profiles").select("club_id").eq("user_id", callerId).maybeSingle(),
      admin.from("coach_athletes").select("coach_id").eq("athlete_id", athleteId).maybeSingle(),
    ]);
    const roles = (rolesRows ?? []).map((r: any) => r.role);
    const isAdmin = roles.includes("admin");
    const isCoach = roles.includes("coach");
    const isCurrentCoach = currentLink?.coach_id === callerId;
    const sameClub = !!(athleteProfile?.club_id && callerProfile?.club_id && athleteProfile.club_id === callerProfile.club_id);
    const allowed = isAdmin || isCurrentCoach || (isCoach && sameClub);
    if (!allowed) return json({ error: "forbidden" }, 403);

    if (action === "list_coaches") {
      const clubId = athleteProfile?.club_id ?? callerProfile?.club_id ?? null;
      // Without a club context we cannot safely scope the coach list, so refuse
      // to enumerate all coaches system-wide.
      if (!clubId) {
        return json({ coaches: [], current_coach_id: currentLink?.coach_id ?? null });
      }
      // Find all coach user_ids
      const { data: coachRoleRows } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("role", "coach");
      const coachIds = (coachRoleRows ?? []).map((r: any) => r.user_id);
      if (coachIds.length === 0) return json({ coaches: [], current_coach_id: currentLink?.coach_id ?? null });
      let q = admin
        .from("profiles")
        .select("user_id, display_name, avatar_url, club_id")
        .in("user_id", coachIds);
      if (clubId) q = q.eq("club_id", clubId);
      const { data: coaches } = await q;
      return json({
        coaches: (coaches ?? []).sort((a: any, b: any) =>
          (a.display_name || "").localeCompare(b.display_name || ""),
        ),
        current_coach_id: currentLink?.coach_id ?? null,
      });
    }

    if (action === "reassign") {
      const newCoachId = (body.coach_id ?? null) as string | null;
      if (newCoachId !== null && typeof newCoachId !== "string") {
        return json({ error: "coach_id must be string or null" }, 400);
      }
      // If non-admin, restrict newCoachId to a coach in the athlete's club
      if (!isAdmin && newCoachId) {
        const { data: targetRoles } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", newCoachId);
        const targetIsCoach = (targetRoles ?? []).some((r: any) => r.role === "coach");
        const { data: targetProfile } = await admin
          .from("profiles")
          .select("club_id")
          .eq("user_id", newCoachId)
          .maybeSingle();
        if (!targetIsCoach || !athleteProfile?.club_id || targetProfile?.club_id !== athleteProfile.club_id) {
          return json({ error: "target coach must be in same club" }, 400);
        }
      }
      await admin.from("coach_athletes").delete().eq("athlete_id", athleteId);
      if (newCoachId) {
        const clubId = athleteProfile?.club_id ?? callerProfile?.club_id ?? null;
        if (!clubId) {
          return json({ error: "athlete has no club_id — cannot assign coach" }, 400);
        }
        const { error } = await admin
          .from("coach_athletes")
          .insert({ coach_id: newCoachId, athlete_id: athleteId, club_id: clubId });
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    console.error("reassign-athlete-coach error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});
