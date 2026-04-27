// Coach-side manual creation of a post-competition reflection on behalf of an athlete.
// Bypasses athlete-side RLS so a coach can record what an athlete shared verbally
// or recover a stuck offline submission. Authorised only when the caller is a coach
// AND the athlete is one of their managed athletes OR shares the same club.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RATING_KEYS = [
  "overallPerformance",
  "mentalReadiness",
  "focusDuringMatches",
  "emotionalControl",
  "tacticalExecution",
  "physicalCondition",
  "recoveryBetweenMatches",
  "postCompMood",
];

const REFLECTION_KEYS = [
  "wentWell",
  "didntGoWell",
  "biggestLearning",
  "whatIdDoDifferently",
  "mentalTriggers",
];

function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function trimStr(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const coachId = userData.user.id;

    // Parse + validate payload
    const body = await req.json().catch(() => ({}));
    const raw = JSON.stringify(body || {});
    if (raw.length > 10_000) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const athleteId = trimStr(body.athlete_id, 64);
    const competition_id = body.competition_id ? trimStr(body.competition_id, 64) : null;
    const competition_name = trimStr(body.competition_name, 200) || null;
    const competition_date = body.competition_date ? trimStr(body.competition_date, 32) : null;
    const result = body.result ? trimStr(body.result, 200) : null;

    if (!athleteId) {
      return new Response(JSON.stringify({ error: "athlete_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ratings: Record<string, number> = {};
    const inRatings = (body.ratings && typeof body.ratings === "object") ? body.ratings : {};
    for (const k of RATING_KEYS) {
      const c = clampInt((inRatings as any)[k], 1, 10);
      if (c !== null) ratings[k] = c;
    }
    const reflections: Record<string, string> = {};
    const inRefl = (body.reflections && typeof body.reflections === "object") ? body.reflections : {};
    for (const k of REFLECTION_KEYS) {
      const s = trimStr((inRefl as any)[k], 1000).trim();
      if (s) reflections[k] = s;
    }

    // Authorise: coach role + (managed athlete OR same club)
    const admin = createClient(supabaseUrl, serviceRole);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", coachId)
      .eq("role", "coach")
      .maybeSingle();
    if (!roles) {
      return new Response(JSON.stringify({ error: "Coach role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: managed } = await admin
      .from("coach_athletes")
      .select("id")
      .eq("coach_id", coachId)
      .eq("athlete_id", athleteId)
      .maybeSingle();

    let allowed = !!managed;
    if (!allowed) {
      const { data: shareCheck } = await admin.rpc("users_share_club", {
        _first_user_id: coachId,
        _second_user_id: athleteId,
      });
      allowed = !!shareCheck;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Not authorised for this athlete" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert as service role, attributed to athlete
    const { data: inserted, error: insertErr } = await admin
      .from("competition_reflections")
      .insert({
        user_id: athleteId,
        competition_id,
        competition_name,
        competition_date,
        result,
        ratings,
        reflections,
        ai_plan: null,
        next_competition_id: null,
      })
      .select("id, created_at")
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ id: inserted.id, created_at: inserted.created_at }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
