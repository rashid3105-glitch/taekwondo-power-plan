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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const notEntitled = await checkAIEntitlement(userId, corsHeaders);
    if (notEntitled) return notEntitled;

    const body = await req.text();
    if (body.length > 10000) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { answers, scores, totalScore, profile, language } = JSON.parse(body);

    // Validate answers structure and length
    if (answers != null) {
      if (typeof answers !== "object" || Array.isArray(answers)) {
        return new Response(JSON.stringify({ error: "Invalid answers format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (Object.keys(answers).length > 30) {
        return new Response(JSON.stringify({ error: "Too many answers (max 30)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      for (const val of Object.values(answers)) {
        if (typeof val === "string" && val.length > 200) {
          return new Response(JSON.stringify({ error: "Answer too long (max 200 characters)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }

    const lang = language === "da" ? "Danish" : language === "sv" ? "Swedish" : language === "de" ? "German" : language === "ar" ? "Arabic" : "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discipline = profile?.discipline || 'sparring';
    const isSparring = discipline === 'sparring';

    const systemPrompt = `You are a sports psychologist specializing in combat sports and taekwondo. You provide personalized mental performance advice based on assessment results.

The athlete is a ${isSparring ? 'SPARRING (fighter)' : 'POOMSAE (forms)'} specialist. Tailor all advice accordingly:
${isSparring
  ? `- Focus on combat mindset: managing aggression, reading opponents, handling pain/impact
- Pre-fight mental preparation and adrenaline management
- Dealing with direct confrontation and physical contact
- Split-second decision making under pressure`
  : `- Focus on performance mindset: precision under scrutiny, perfectionism management
- Pre-performance visualization of form sequences
- Managing pressure of being judged/scored
- Flow state and movement meditation
- Consistency and repetition mindset`}

Your advice should be:
- Practical and actionable (specific techniques they can use today)
- Sport-specific to taekwondo ${isSparring ? 'sparring' : 'poomsae'}
- Empathetic and encouraging
- Evidence-based (CBT, mindfulness, visualization, etc.)

Categories assessed:
- Mental Toughness: resilience, grit, pushing through adversity
- Competition Anxiety: managing pre-${isSparring ? 'fight' : 'performance'} nerves, staying calm under pressure
- Focus & Concentration: staying present during training and competition
- Recovery from Loss: bouncing back after ${isSparring ? 'losing a fight' : 'a poor score'} or bad performance
- Confidence: self-belief and positive self-talk
- Motivation: maintaining drive and commitment

Score range per category: 1-5 (1=needs work, 5=excellent). Each category has 3-4 questions averaged.

Write ALL content in ${lang}.

Return a JSON object:
{
  "summary": "2-3 sentence overview of their mental state",
  "strengths": ["list of 2-3 mental strengths based on high scores"],
  "improvementAreas": [
    {
      "area": "category name",
      "score": number,
      "techniques": ["3-4 specific techniques/exercises to improve"],
      "dailyHabit": "one simple daily habit to build this skill"
    }
  ],
  "preCompetitionRoutine": "A step-by-step 10-minute pre-${isSparring ? 'fight' : 'performance'} mental routine personalized to their needs",
  "affirmations": ["3 personalized affirmations based on their weak areas"]
}

Return ONLY valid JSON, no markdown fences.`;

    const userPrompt = `Assessment results for a taekwondo ${isSparring ? 'sparring' : 'poomsae'} athlete:
- Discipline: ${isSparring ? 'Sparring (Fighter)' : 'Poomsae (Forms)'}
- Belt level: ${profile?.belt_level || "not specified"}
- Experience: ${profile?.experience_years || "not specified"} years
- Age: ${profile?.age || "not specified"}

Category scores (1-5 scale):
${Object.entries(scores).map(([k, v]) => `- ${k}: ${v}/5`).join("\n")}

Total score: ${totalScore}/30

Detailed answers:
${JSON.stringify(answers, null, 2)}

Provide personalized mental performance advice focusing on their weakest areas, tailored to ${isSparring ? 'sparring competition' : 'poomsae performance'}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let advice;
    try {
      advice = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, advice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-mental-advice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
