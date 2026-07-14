import { createClient } from "npm:@supabase/supabase-js@2";
import { checkCronAuth } from "../_shared/cronAuth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const unauthorized = checkCronAuth(req, cors);
  if (unauthorized) return unauthorized;

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allAthletes } = await admin
      .from("profiles")
      .select("user_id, display_name")
      .eq("is_approved", true)
      .eq("is_parent", false)
      .not("club_id", "is", null);

    if (!allAthletes?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: recentAssessments } = await admin
      .from("mental_assessments")
      .select("user_id")
      .gte("created_at", thirtyDaysAgo);

    const recentIds = new Set((recentAssessments ?? []).map((a: any) => a.user_id));
    const dueAthletes = allAthletes.filter((a: any) => !recentIds.has(a.user_id));

    let sent = 0;
    for (const athlete of dueAthletes) {
      const { data: subs } = await admin
      .from("push_subscriptions")
      .select("fcm_token")
      .eq("user_id", athlete.user_id)
      .eq("is_active", true)
      .limit(1);

      if (subs?.length) {
        await admin.functions.invoke("send-push", {
          body: {
            user_ids: [athlete.user_id],
            title: "Månedlig mental vurdering",
            body: "Det er tid til din månedlige mentale gennemgang. Det tager under 2 minutter.",
            url: "/dashboard?tab=mental",
            tag: "monthly-mental-reminder",
          },
        }).catch(() => {});
        sent++;
      }
    }

    return new Response(JSON.stringify({ sent, due: dueAthletes.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
