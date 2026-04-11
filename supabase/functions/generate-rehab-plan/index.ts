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
    const { injury, profile, language } = JSON.parse(body);
    const lang = language === "da" ? "Danish" : language === "sv" ? "Swedish" : language === "de" ? "German" : language === "ar" ? "Arabic" : "English";
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

    const systemPrompt = `You are an expert sports physiotherapist and strength & conditioning coach specializing in martial arts injury rehabilitation. You create evidence-based rehab programs for muscle/tendon injuries common in taekwondo athletes.

Your programs must:
- Be progressive (pain-free ROM → loading → sport-specific return)
- Include specific sets, reps, tempo, and rest periods
- Prioritize tissue healing timelines
- Include criteria for progressing between phases
- Be safe and conservative — when in doubt, be cautious

Return a valid JSON object with this exact structure:
{
  "rehabPlanName": "string",
  "injurySummary": "string (brief explanation of the injury type and typical recovery)",
  "estimatedWeeks": number,
  "importantNotes": ["string (key safety notes, red flags to watch for)"],
  "phases": [
    {
      "phase": "string (e.g. 'Acute/Protection', 'Early Rehab', 'Late Rehab', 'Return to Sport')",
      "weeks": "string (e.g. '1-2')",
      "goal": "string",
      "criteria": "string (what must be achieved before moving to next phase)",
      "exercises": [
        {
          "name": "string",
          "category": "rehab" | "mobility" | "strength" | "plyometric",
          "sets": number,
          "reps": "string",
          "tempo": "string or null",
          "rest": "string",
          "coachingCue": "string",
          "whyItMatters": "string (how this helps the specific injury)",
          "progressionTip": "string (how to make it harder when ready)",
          "painGuideline": "string (e.g. 'Stop if pain > 3/10')"
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences.
IMPORTANT: ALL text content (rehabPlanName, injurySummary, importantNotes, phase names, goals, criteria, exercise names where appropriate, coachingCues, whyItMatters, progressionTips, painGuidelines) MUST be written in ${lang}.`;

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
