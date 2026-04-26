import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  sleep_hours: z.number().min(0).max(16),
  soreness: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  motivation: z.number().int().min(1).max(5),
  is_sick: z.boolean().default(false),
});

function computeScore(d: z.infer<typeof Body>): { score: number; recommendation: string } {
  const sleepNorm = Math.min(1, d.sleep_hours / 8); // 0–1
  let score = sleepNorm * 30 + (6 - d.soreness) * 7 + d.mood * 7 + d.motivation * 6;
  if (d.is_sick) score -= 40;
  score = Math.max(0, Math.min(100, Math.round(score)));
  let recommendation = "green";
  if (score < 40 || d.is_sick) recommendation = "red";
  else if (score < 65) recommendation = "amber";
  return { score, recommendation };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { score, recommendation } = computeScore(parsed.data);
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supa.from("readiness_checkins").upsert({
      user_id: user.id, checkin_date: today, ...parsed.data, score, recommendation,
    }, { onConflict: "user_id,checkin_date" }).select().single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
