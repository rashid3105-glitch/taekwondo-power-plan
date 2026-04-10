import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.text();
    if (body.length > 10000) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { profile, goals, language, custom_calories } = JSON.parse(body);
    if (profile?.current_injury && typeof profile.current_injury === "string" && profile.current_injury.length > 500) {
      return new Response(JSON.stringify({ error: "Injury description too long (max 500 characters)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const lang = language === "da" ? "Danish" : language === "sv" ? "Swedish" : "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert sports nutritionist specializing in martial arts and taekwondo athletes. You create personalized nutrition plans that support athletic performance, recovery, and body composition goals.

CRITICAL HEALTH GUIDELINES:
- NEVER recommend extreme caloric restriction (below 1500 kcal for women, 1800 kcal for men)
- ALWAYS emphasize that weight loss without professional guidance from a registered dietitian or doctor can be dangerous
- NEVER recommend crash diets, fad diets, or extreme approaches
- If the athlete's goal involves weight loss, ALWAYS include a prominent health warning about consulting a healthcare professional
- Focus on PERFORMANCE NUTRITION, not just aesthetics
- Emphasize nutrient timing around training sessions
- Account for the athlete's training intensity and recovery needs
- NEVER include pork or any pig-derived products (bacon, ham, pork chops, lard, gelatin from pork, etc.). Use chicken, turkey, beef, lamb, fish, or plant-based protein alternatives instead.

For each meal, include:
- Meal name and timing relative to training
- Specific foods with approximate portions
- Macronutrient focus (protein, carbs, fats)
- Why this meal matters for taekwondo performance

Return a valid JSON object with this exact structure:
{
  "planName": "string",
  "healthWarning": "string (ALWAYS include a warning about consulting healthcare professionals, especially for weight-related goals)",
  "dailyCalorieEstimate": "string (e.g. '2200-2500 kcal')",
  "macroSplit": {
    "protein": "string (e.g. '30%')",
    "carbs": "string (e.g. '45%')",
    "fats": "string (e.g. '25%')"
  },
  "keyPrinciples": ["string array of 4-6 key nutrition principles for this athlete"],
  "meals": [
    {
      "name": "string",
      "timing": "string (e.g. 'Pre-training, 2h before')",
      "foods": ["string array of specific foods with portions"],
      "macroFocus": "string (e.g. 'High carb, moderate protein')",
      "whyItMatters": "string"
    }
  ],
  "hydration": {
    "daily": "string",
    "preTrain": "string",
    "duringTrain": "string",
    "postTrain": "string"
  },
  "supplements": [
    {
      "name": "string",
      "dosage": "string",
      "timing": "string",
      "reason": "string",
      "warning": "string (any contraindications or notes)"
    }
  ],
  "weeklyVariation": "string (how to vary meals across the week)"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences.
CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL text content — including plan names, meal names, food descriptions, timing labels, principles, warnings, supplement info, and all explanations — entirely in ${lang}. Do NOT mix languages. Every single string value in the JSON must be in ${lang}.`;

    const goalsText = goals?.length ? goals.join(", ") : "general athletic performance";

    const userPrompt = `Create a personalized nutrition plan for this taekwondo athlete:
- Age: ${profile.age || "not specified"}
- Weight: ${profile.weight_kg ? profile.weight_kg + " kg" : "not specified"}
- Belt level: ${profile.belt_level || "not specified"}
- Discipline: ${profile.discipline === "poomsae" ? "Poomsae (Forms)" : "Sparring (Fighter)"}
- TKD sessions per week: ${profile.tkd_sessions_per_week || 3}
- Years of experience: ${profile.experience_years || "not specified"}
- Nutrition goals: ${goalsText}
- Current injury: ${profile.current_injury || "none"}

${goals?.includes("Weight loss") || goals?.includes("Lose weight") ? `
CRITICAL: The athlete has selected weight loss as a goal. You MUST:
1. Include a VERY PROMINENT health warning about the dangers of unsupervised weight loss
2. Strongly recommend consulting a registered dietitian or doctor
3. Emphasize that weight cutting for competition MUST be supervised by a professional
4. Focus on gradual, sustainable approaches (max 0.5kg/week loss)
5. Never recommend going below safe caloric minimums
6. Warn about the risks of rapid weight loss on athletic performance, bone density, and hormonal health
` : ""}

CRITICAL: Write ALL text in ${lang}. Every value in the JSON response must be in ${lang}.`;

    const aiPayload = JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let response: Response | null = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: aiPayload,
      });

      if (response.ok || response.status === 429 || response.status === 402) break;

      // For 5xx errors, wait and retry
      if (response.status >= 500 && attempt < maxRetries - 1) {
        console.warn(`AI gateway returned ${response.status}, retrying (${attempt + 1}/${maxRetries})...`);
        await response.text(); // consume body
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const status = response?.status || 500;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = response ? await response.text() : "no response";
      console.error("AI gateway error after retries:", status, t);
      return new Response(JSON.stringify({ error: "AI service is temporarily unavailable. Please try again in a minute." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-nutrition-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
