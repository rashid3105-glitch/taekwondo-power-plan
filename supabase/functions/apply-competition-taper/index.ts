// Marks the two weeks before a competition's event_date as a taper in the athlete's
// active training plan. Volume multiplier 0.7 in week -2 and 0.5 in week -1; intensity unchanged.
// The frontend reads `taper_overlay` from plan_data to render badges and adjust set counts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const competitionId: string | undefined = body?.competition_id;
    if (!competitionId) {
      return new Response(JSON.stringify({ error: "Missing competition_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: comp } = await userClient
      .from("competitions")
      .select("id, user_id, event_date, name, priority")
      .eq("id", competitionId)
      .maybeSingle();
    if (!comp) {
      return new Response(JSON.stringify({ error: "Competition not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan } = await userClient
      .from("training_plans")
      .select("id, plan_data")
      .eq("user_id", comp.user_id)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) {
      return new Response(JSON.stringify({ ok: true, applied: false, reason: "no active plan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventDate = new Date(comp.event_date);
    const weekMinus1Start = new Date(eventDate.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const weekMinus2Start = new Date(eventDate.getTime() - 14 * 86400000).toISOString().slice(0, 10);

    const overlay = {
      competition_id: comp.id,
      competition_name: comp.name,
      event_date: comp.event_date,
      priority: comp.priority,
      weeks: [
        { start: weekMinus2Start, label: "Taper week -2", volume_multiplier: 0.7 },
        { start: weekMinus1Start, label: "Taper week -1", volume_multiplier: 0.5 },
      ],
    };

    const planData = (plan.plan_data || {}) as Record<string, any>;
    const overlays: any[] = Array.isArray(planData.taper_overlays) ? planData.taper_overlays : [];
    const filtered = overlays.filter((o) => o?.competition_id !== comp.id);
    filtered.push(overlay);
    planData.taper_overlays = filtered;

    const { error: updErr } = await userClient
      .from("training_plans")
      .update({ plan_data: planData })
      .eq("id", plan.id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true, applied: true, overlay }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
