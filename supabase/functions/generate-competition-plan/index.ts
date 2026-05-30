// Generate a peaking + weight-cut plan using Lovable AI Gateway.
// Safety rails enforced server-side: max 0.7 kg/week cut, no >5% body weight in <14 days.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";
import { sanitizePromptText } from "../_shared/sanitizePrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({ competition_id: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const notEntitled = await checkAIEntitlement(user.id, corsHeaders);
    if (notEntitled) return notEntitled;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: "Bad input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: comp } = await supa.from("competitions").select("*").eq("id", parsed.data.competition_id).eq("user_id", user.id).single();
    if (!comp) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: prof } = await supa.from("profiles").select("weight_kg, age, belt_level, discipline").eq("user_id", user.id).single();
    const { data: latestWeight } = await supa.from("weight_logs").select("weight_kg, log_date").eq("user_id", user.id).order("log_date", { ascending: false }).limit(1).maybeSingle();

    const currentKg = Number(latestWeight?.weight_kg ?? prof?.weight_kg ?? 0);
    const targetKg = Number(comp.weight_class_kg ?? currentKg);
    const daysToEvent = Math.max(0, Math.round((new Date(comp.event_date).getTime() - Date.now()) / 86400000));
    const cutKg = Math.max(0, currentKg - targetKg);
    const safeRatePerWeek = 0.7;
    const maxSafeCut = (daysToEvent / 7) * safeRatePerWeek;

    const warnings: string[] = [];
    if (cutKg > maxSafeCut) warnings.push(`Cutting ${cutKg.toFixed(1)} kg in ${daysToEvent} days exceeds the safe rate of 0.7 kg/week. Consider moving up a weight class.`);
    if (currentKg > 0 && cutKg / currentKg > 0.05 && daysToEvent < 14) warnings.push("Cut exceeds 5% bodyweight in <14 days — high risk of performance loss and dehydration.");
    if (daysToEvent < 7 && cutKg > 1.5) warnings.push("Less than 1 week out: avoid aggressive cuts.");

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const prompt = `You are a TKD performance coach. Generate a JSON peaking and weight-cut plan.
Athlete: age ${prof?.age ?? "?"}, ${prof?.belt_level ?? "?"} belt, discipline ${prof?.discipline ?? "sparring"}.
Current weight: ${currentKg} kg. Target: ${targetKg} kg. Days to event: ${daysToEvent}. Priority: ${comp.priority}.
Return strict JSON: { "taperSummary": string (2-3 sentences), "weeklyTaper": [{"week": number, "focus": string, "volumeChange": string, "intensity": string}], "weightCut": [{"day": number, "targetKg": number, "calorieAdjustment": string, "fluid": string}], "nutritionAdjustments": { "dailyCalories": number, "carbCycling": string, "hydration": string }, "peakDayProtocol": string }.
Keep it concise. No markdown, only JSON.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: txt.slice(0, 200) }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    let plan: any = {};
    try { plan = JSON.parse(aiJson.choices?.[0]?.message?.content || "{}"); } catch { plan = {}; }
    plan.warnings = warnings;
    plan.meta = { currentKg, targetKg, cutKg, daysToEvent, generatedAt: new Date().toISOString() };

    const { error: upErr } = await supa.from("competitions").update({ plan_data: plan }).eq("id", comp.id);
    if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
