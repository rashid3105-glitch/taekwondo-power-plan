// Weekly Monday digest for every coach. Designed to be invoked by pg_cron with the service role.
// Calls send-transactional-email per coach using template "coach-weekly-digest".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://sportstalent.dk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find every coach
    const { data: coachRoles } = await supa
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");

    const coachIds = (coachRoles || []).map((r) => r.user_id);
    if (!coachIds.length) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out opt-outs
    const { data: prefs } = await supa
      .from("notification_preferences")
      .select("user_id, weekly_digest")
      .in("user_id", coachIds);
    const optedOut = new Set((prefs || []).filter((p) => p.weekly_digest === false).map((p) => p.user_id));

    // Resolve coach emails via admin auth API
    const { data: usersList } = await supa.auth.admin.listUsers({ perPage: 1000 });
    const coachEmailMap = new Map<string, { email: string; name: string }>();
    for (const u of usersList?.users || []) {
      if (u.id && coachIds.includes(u.id) && u.email) {
        const name = (u.user_metadata?.display_name as string) || (u.user_metadata?.full_name as string) || "Coach";
        coachEmailMap.set(u.id, { email: u.email, name });
      }
    }

    // Compute "this week" boundaries
    const now = new Date();
    const dayOfWeek = (now.getUTCDay() + 6) % 7; // Mon=0
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek));
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 86400000);
    const wsStr = weekStart.toISOString().slice(0, 10);
    const lwsStr = lastWeekStart.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

    let processed = 0;
    let skipped = 0;

    for (const coachId of coachIds) {
      if (optedOut.has(coachId)) { skipped++; continue; }
      const meta = coachEmailMap.get(coachId);
      if (!meta) { skipped++; continue; }

      // Athletes for this coach
      const { data: links } = await supa
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", coachId);
      const athleteIds = (links || []).map((l) => l.athlete_id);
      if (!athleteIds.length) { skipped++; continue; }

      // Display names
      const { data: athleteProfiles } = await supa
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", athleteIds);
      const nameMap = new Map((athleteProfiles || []).map((p) => [p.user_id, p.display_name || "Athlete"]));

      // This-week & last-week form curves
      const { data: thisWeek } = await supa
        .from("form_curve_weekly")
        .select("user_id, composite_score, overtraining_flag")
        .in("user_id", athleteIds)
        .eq("week_start", wsStr);
      const { data: lastWeek } = await supa
        .from("form_curve_weekly")
        .select("user_id, composite_score")
        .in("user_id", athleteIds)
        .eq("week_start", lwsStr);
      const lastMap = new Map((lastWeek || []).map((r) => [r.user_id, r.composite_score]));

      // Workout activity in last 7 days
      const { data: recentLogs } = await supa
        .from("workout_logs")
        .select("user_id")
        .in("user_id", athleteIds)
        .gte("logged_date", sevenDaysAgo);
      const activeSet = new Set((recentLogs || []).map((r) => r.user_id));

      const trendingUp: { name: string; note?: string }[] = [];
      const atRisk: { name: string; note?: string }[] = [];
      const inactive: { name: string; note?: string }[] = [];

      for (const aid of athleteIds) {
        const name = nameMap.get(aid) as string;
        const tw = (thisWeek || []).find((r) => r.user_id === aid);
        const prev = lastMap.get(aid) as number | undefined;
        if (tw && typeof prev === "number" && prev > 0 && tw.composite_score >= prev * 1.1) {
          trendingUp.push({ name, note: `+${Math.round(((tw.composite_score - prev) / prev) * 100)}% form` });
        }
        if (tw?.overtraining_flag) {
          atRisk.push({ name, note: "Strain elevated 2+ weeks" });
        }
        if (!activeSet.has(aid)) {
          inactive.push({ name, note: "0 sessions in 7 days" });
        }
      }

      // Send email via existing transactional pipeline
      try {
        await supa.functions.invoke("send-transactional-email", {
          body: {
            template_name: "coach-weekly-digest",
            to: meta.email,
            data: {
              coachName: meta.name,
              totalAthletes: athleteIds.length,
              trendingUp,
              atRisk,
              inactive,
              dashboardUrl: `${SITE_URL}/coach`,
            },
          },
        });
        processed++;
      } catch (sendErr) {
        console.error("digest send failed", coachId, sendErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, processed, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
