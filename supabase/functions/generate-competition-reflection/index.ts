// Generates an AI-driven action plan from a post-competition reflection.
// Takes the athlete's quick ratings + guided answers, returns strengths,
// focus areas, and 3 SMART goals for the next competition.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const raw = await req.text();
    if (raw.length > 10000) return json({ error: "Request too large" }, 400);
    const { ratings, reflections, competition, recentBaselineScores, profile, language } = JSON.parse(raw);

    // Validate ratings
    if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
      return json({ error: "Invalid ratings" }, 400);
    }
    if (Object.keys(ratings).length > 12) return json({ error: "Too many ratings" }, 400);
    for (const v of Object.values(ratings)) {
      if (typeof v !== "number" || v < 1 || v > 5) return json({ error: "Ratings must be 1-5" }, 400);
    }
    // Validate reflections (free text, capped 280 chars per field)
    if (reflections && typeof reflections === "object") {
      if (Object.keys(reflections).length > 10) return json({ error: "Too many reflection fields" }, 400);
      for (const v of Object.values(reflections)) {
        if (typeof v === "string" && v.length > 320) {
          return json({ error: "Reflection field too long (max 320 chars)" }, 400);
        }
      }
    }

    const lang =
      language === "da" ? "Danish" :
      language === "sv" ? "Swedish" :
      language === "de" ? "German" :
      language === "ar" ? "Arabic" :
      language === "no" ? "Norwegian (Bokmål)" :
      "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discipline = profile?.discipline || "sparring";
    const isSparring = discipline === "sparring";

    const systemPrompt = `You are a sports psychologist and elite ${isSparring ? "taekwondo sparring" : "taekwondo poomsae"} coach.
The athlete has just completed a competition and is reflecting on it 0-48 hours after the event.
Your job is to turn their ratings + free-text reflection into a focused, encouraging, SPECIFIC action plan for the NEXT competition.

Guidelines:
- Be empathetic but analytical. Acknowledge feelings before prescribing fixes.
- Tie every focus area back to a concrete observation in their answers — never generic.
- Goals must be SMART: Specific, Measurable, Achievable, Relevant, Time-bound (before the next comp).
- Reference taekwondo-specific drills/concepts when relevant (footwork patterns, kihap, sparring rounds, hogu adjustments, ${isSparring ? "step-back counter, switch-stance, head-kick setup" : "sine wave, kihap timing, balance hold, breathing rhythm"}, mental rehearsal, breathing protocols).
- Write ALL output in ${lang}.

Return ONLY valid JSON (no markdown fences) matching:
{
  "summary": "2-3 sentences, empathetic + analytical",
  "strengths": ["2-4 short bullets — what they did well"],
  "focusAreas": [
    { "area": "short label", "why": "1 sentence tied to their answers", "suggestedDrills": ["2-3 concrete drills"] }
  ],
  "nextCompetitionGoals": [
    { "goal": "SMART goal", "why": "1 sentence", "how": "1-2 sentences of practical steps", "metric": "observable success criterion" }
  ],
  "mentalRoutineUpdates": ["2-3 concrete tweaks to their pre-comp routine"],
  "recommendedAssessment": false
}

Exactly 3 nextCompetitionGoals. Anchor every goal directly to the athlete's lowest performance scores — the dimensions they rated weakest on the 1–10 scale should drive the focus areas and SMART goals. Briefly reference the score (e.g. "you rated tactical execution 4/10") in the "why" so the athlete sees the link between their self-assessment and the goal. Set recommendedAssessment=true only if their overall ratings are mostly ≤4/10 and warrant re-doing the full mental baseline.`;

    const ratingsText = Object.entries(ratings)
      .map(([k, v]) => `- ${k}: ${v}/10`)
      .join("\n");
    const reflectionsText = Object.entries(reflections || {})
      .filter(([, v]) => typeof v === "string" && v.trim().length > 0)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    const baselineText = recentBaselineScores
      ? `Recent baseline mental scores (1-5):\n${Object.entries(recentBaselineScores).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
      : "No recent baseline mental assessment available.";

    const userPrompt = `Competition: ${competition?.name || "Unnamed"}
Date: ${competition?.date || "unknown"}
Result: ${competition?.result || "not recorded"}

Athlete profile:
- Discipline: ${isSparring ? "Sparring" : "Poomsae"}
- Belt: ${profile?.belt_level || "unknown"}
- Experience: ${profile?.experience_years ?? "unknown"} years
- Age: ${profile?.age ?? "unknown"}

Performance ratings (1=poor, 10=excellent) — the lowest scores should drive the next competition's goals:
${ratingsText}

Reflection answers:
${reflectionsText || "(none provided)"}

${baselineText}

Generate the post-competition action plan, with goals targeted at lifting the lowest-rated dimensions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }, 402);
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return json({ error: "AI service error" }, 500);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return json({ error: "Failed to parse AI response" }, 500);
    }

    return json({ success: true, plan });
  } catch (e) {
    console.error("generate-competition-reflection error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
