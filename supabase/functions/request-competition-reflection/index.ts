// Coach asks selected (or all) participants of a competition to submit a post-competition reflection.
// Creates competition_reflection_requests rows (idempotent on unique key), an event_reminders row,
// and sends a push notification deep-linking to the reflection wizard.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const j = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return j({ error: "Unauthorized" }, 401);

    const raw = await req.text();
    if (raw.length > 4000) return j({ error: "Request too large" }, 400);
    const body = JSON.parse(raw || "{}");
    const competition_id: string | undefined = body.competition_id;
    const athlete_ids: string[] | undefined = body.athlete_ids;
    if (!competition_id || typeof competition_id !== "string") {
      return j({ error: "competition_id required" }, 400);
    }
    if (athlete_ids && (!Array.isArray(athlete_ids) || athlete_ids.length > 200)) {
      return j({ error: "Bad athlete_ids" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch the source competition (template)
    const { data: srcComp, error: compErr } = await admin
      .from("competitions")
      .select("id, name, event_date, location, user_id")
      .eq("id", competition_id)
      .single();
    if (compErr || !srcComp) return j({ error: "Competition not found" }, 404);

    // Caller's coach links + club
    const [{ data: coachLinks }, { data: coachProfile }, { data: roles }] = await Promise.all([
      admin.from("coach_athletes").select("athlete_id").eq("coach_id", user.id),
      admin.from("profiles").select("club_id").eq("user_id", user.id).maybeSingle(),
      admin.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const isCoach = (roles || []).some((r: any) => r.role === "coach");
    if (!isCoach) return j({ error: "Forbidden — coach role required" }, 403);

    const managedIds = new Set<string>((coachLinks || []).map((l: any) => l.athlete_id));
    const coachClubId: string | null = coachProfile?.club_id ?? null;

    // Resolve participants: all athletes who have a competitions row matching name + date
    const { data: matchingComps } = await admin
      .from("competitions")
      .select("user_id, id")
      .eq("name", srcComp.name)
      .eq("event_date", srcComp.event_date);

    let participantIds: string[] = Array.from(
      new Set((matchingComps || []).map((c: any) => c.user_id as string)),
    );

    if (athlete_ids && athlete_ids.length > 0) {
      const filter = new Set(athlete_ids);
      participantIds = participantIds.filter((id) => filter.has(id));
    }

    if (participantIds.length === 0) return j({ requested: 0, skipped: 0 });

    // Authorization filter: caller must be managed-coach OR share club with each athlete
    const { data: clubMates } = coachClubId
      ? await admin.from("profiles").select("user_id").eq("club_id", coachClubId)
      : { data: [] as any[] };
    const clubMateIds = new Set<string>((clubMates || []).map((p: any) => p.user_id));

    const allowed = participantIds.filter((id) => managedIds.has(id) || clubMateIds.has(id));

    if (allowed.length === 0) return j({ requested: 0, skipped: 0 });

    // Skip athletes who already submitted a reflection for this competition (by name + date)
    const { data: existingReflections } = await admin
      .from("competition_reflections")
      .select("user_id")
      .in("user_id", allowed)
      .eq("competition_name", srcComp.name)
      .eq("competition_date", srcComp.event_date);
    const submittedSet = new Set<string>((existingReflections || []).map((r: any) => r.user_id));

    let requested = 0;
    let skipped = submittedSet.size;

    for (const athleteId of allowed) {
      if (submittedSet.has(athleteId)) continue;

      // Find this athlete's own competition row (so deep-link routes to /competitions/:id/reflect)
      const athleteCompId =
        (matchingComps || []).find((c: any) => c.user_id === athleteId)?.id ?? null;
      if (!athleteCompId) continue;

      // Athlete's club for audit
      const { data: athleteProfile } = await admin
        .from("profiles")
        .select("club_id")
        .eq("user_id", athleteId)
        .maybeSingle();

      // Upsert request row (idempotent)
      await admin
        .from("competition_reflection_requests")
        .upsert(
          {
            competition_id: athleteCompId,
            athlete_id: athleteId,
            coach_id: user.id,
            club_id: athleteProfile?.club_id ?? coachClubId ?? null,
            requested_at: new Date().toISOString(),
          },
          { onConflict: "competition_id,athlete_id" },
        );

      // In-app reminder
      await admin.from("event_reminders").insert({
        coach_id: user.id,
        athlete_id: athleteId,
        title: srcComp.name,
        event_date: srcComp.event_date,
        message: `Coachen beder dig evaluere stævnet "${srcComp.name}".`,
        club_id: athleteProfile?.club_id ?? coachClubId ?? null,
      });

      // Push
      try {
        await admin.functions.invoke("send-push", {
          body: {
            user_ids: [athleteId],
            title: "Evaluering ønskes",
            body: `${srcComp.name} — del din evaluering`,
            url: `/competitions/${athleteCompId}/reflect`,
            tag: `reflection-request-${athleteCompId}`,
          },
        });
      } catch (e) {
        console.warn("send-push failed", e);
      }

      requested += 1;
    }

    return j({ requested, skipped });
  } catch (e: any) {
    console.error("request-competition-reflection error:", e);
    return j({ error: e?.message || "Unknown error" }, 500);
  }
});
