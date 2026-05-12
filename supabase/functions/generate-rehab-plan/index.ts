import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";

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
    const userId = (claimsData.claims as any).sub as string;
    const notEntitled = await checkAIEntitlement(userId, corsHeaders);
    if (notEntitled) return notEntitled;

    const body = await req.text();
    if (body.length > 10000) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { injury, profile, language } = JSON.parse(body);
    const lang = language === "da" ? "Danish" : language === "sv" ? "Swedish" : language === "de" ? "German" : language === "ar" ? "Arabic" : language === "no" ? "Norwegian" : "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!injury || typeof injury !== "string" || injury.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Please describe your injury" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (injury.length > 1000) {
      return new Response(JSON.stringify({ error: "Injury description too long (max 1000 characters)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a sports injury helper for taekwondo athletes. Your job is to create a simple, step-by-step recovery plan that an athlete (including teenagers) can read and follow on their own.

WRITING RULES — follow these strictly:
- Write like you're talking directly to the athlete ("you", "your knee", "when you feel ready")
- No medical jargon. Replace clinical terms with plain words:
  • "ROM" → "how far you can move it"
  • "eccentric loading" → "slowly lowering the weight"
  • "proprioception" → "balance and body awareness"
  • "tissue healing" → "healing"
  • "inflammation" → "swelling and soreness"
  • "acute phase" → "first days after the injury"
  • "pain > 3/10" → "more than mild pain" or "pain above a 3 out of 10 — where 0 is no pain and 10 is the worst imaginable"
  • "sport-specific" → "taekwondo-specific"
  • "progression criteria" → "you're ready for the next step when..."
- Keep sentences short. Maximum 2 sentences per instruction.
- Safety notes should sound caring, not scary: "Take it easy if this hurts more than a little" not "Discontinue if VAS > 3"
- Phase names should be simple: "Rest & Protect", "Start Moving Again", "Get Stronger", "Back to Training"
- Goals should be motivating: "Get the swelling down and protect the injury" not "Reduce inflammatory response"

Return a valid JSON object with this exact structure:
{
  "rehabPlanName": "string (simple name like 'Knee Sprain Recovery Plan')",
  "injurySummary": "string (2-3 sentences in plain language explaining what happened and roughly how long recovery takes)",
  "estimatedWeeks": number,
  "importantNotes": ["string (caring, plain-language safety reminders — max 1 sentence each)"],
  "phases": [
    {
      "phase": "string (simple phase name)",
      "weeks": "string (e.g. 'Week 1–2')",
      "goal": "string (simple motivating goal)",
      "criteria": "string (plain language: 'You're ready for the next step when you can...')",
      "exercises": [
        {
          "name": "string",
          "category": "rehab" | "mobility" | "strength" | "plyometric",
          "sets": number,
          "reps": "string",
          "tempo": "string or null",
          "rest": "string",
          "coachingCue": "string (what to focus on — plain, short, practical)",
          "whyItMatters": "string (1 sentence in plain language: why this exercise helps YOU recover)",
          "progressionTip": "string (simple: 'When this feels easy, try...')",
          "painGuideline": "string (caring tone: 'Stop if it hurts more than a little' or 'A mild ache is okay — sharp pain means stop')"
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences.
IMPORTANT: ALL text content MUST be written in ${lang}.`;

    const discipline = profile?.discipline || 'sparring';
    const isSparring = discipline === 'sparring';

    const userPrompt = `Create a rehabilitation plan for a taekwondo ${isSparring ? 'SPARRING' : 'POOMSAE'} athlete with the following injury:

Injury: ${injury}
${profile?.age ? `Age: ${profile.age}` : ''}
${profile?.belt_level ? `Belt level: ${profile.belt_level}` : ''}
${profile?.experience_years ? `Years of experience: ${profile.experience_years}` : ''}

${isSparring
  ? `Focus on muscle/tendon tear rehabilitation with progressive return-to-sport protocols specific to taekwondo sparring demands (kicking, footwork, explosive movements, impact absorption).`
  : `Focus on muscle/tendon tear rehabilitation with progressive return-to-sport protocols specific to taekwondo poomsae demands (balance, controlled stances, smooth transitions, flexibility, sustained form sequences).`}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-rehab-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
