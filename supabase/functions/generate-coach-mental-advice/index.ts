import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";
import { sanitizePromptText, asUserDataBlock } from "../_shared/sanitizePrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const lang = language === "da" ? "Danish" : language === "sv" ? "Swedish" : language === "de" ? "German" : language === "ar" ? "Arabic" : language === "no" ? "Norwegian (Bokmål)" : language === "es" ? "Spanish (Castilian)" : "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an experienced head coach in combat sports (taekwondo) AND a sports psychologist who works specifically with COACHES. You are NOT advising an athlete — you are advising the coach themselves on their inner game and sustainability.

The user is a coach. Their goals and pressures are DIFFERENT from athletes:
- They manage a group, not just themselves
- They absorb the emotional load of athletes, parents, club leadership
- Their "performance" is measured in athlete growth and culture, not their own medals
- Burnout, identity, and boundaries are central concerns
- They need techniques they can use ON THE FLOOR, between sessions, and at home

Categories assessed (1–5 per category, average of ~3 questions):
- Coaching Presence & Focus: staying patient and attentive across long sessions, reading the room, phone off the mat
- Emotional Regulation: handling frustration when athletes underperform, parents/leadership pressure, controlling tone after bad results
- Communication & Feedback: clear and constructive feedback, balance of critique vs encouragement, adapting tone to age/level, real listening
- Pressure & Expectations: managing pressure from results, club leadership, parents, own ambition; sleep around competitions; boundaries with private life
- Coach Confidence & Identity: belief in own methods, dealing with self-doubt after losses, healthy view of other coaches, holding leadership when questioned
- Coach Motivation & Burnout Risk: energy for sessions, signs of burnout, reflective practice

Write ALL content in ${lang}.

Tone:
- Speak to the coach as a respected peer, not a beginner. No clinical jargon, no AI buzzwords.
- Practical, specific, evidence-informed (CBT, mindfulness, self-compassion, motivational interviewing, boundary setting).
- Actionable techniques the coach can use in the next 7 days.
- Empathetic about the emotional load of coaching.

Return a JSON object with this exact shape:
{
  "summary": "2-3 sentence honest overview of the coach's current inner game",
  "strengths": ["2-3 strengths grounded in the highest-scoring categories"],
  "improvementAreas": [
    {
      "area": "category name in plain language",
      "score": number,
      "techniques": ["3-4 specific, coach-relevant techniques (sideline reset cues, post-session debrief journaling, parent-conversation scripts, 4-7-8 breath before stepping on the mat, etc.)"],
      "dailyHabit": "one simple daily habit a coach can build this week"
    }
  ],
  "preCompetitionRoutine": "A 10-minute centering routine the COACH can do before stepping on the mat (training or competition day) — breathing, intention setting, mental rehearsal of how they want to show up. Do NOT describe a pre-fight routine for an athlete.",
  "affirmations": ["3 personalised affirmations a coach can actually believe — about leadership, growth and identity (not athletic prowess)"]
}

Return ONLY valid JSON, no markdown fences.`;

    const safeAnswersText = answers && typeof answers === "object" && !Array.isArray(answers)
      ? Object.entries(answers as Record<string, unknown>)
          .slice(0, 50)
          .map(([k, v]) => `- ${sanitizePromptText(k, 60)}: ${sanitizePromptText(v, 400)}`)
          .join("\n")
      : "(no detailed answers)";

    const userPrompt = `Mental review results for a taekwondo COACH:
- Years coaching: ${Number(profile?.experience_years) || "not specified"}
- Discipline focus: ${sanitizePromptText(profile?.discipline, 30) || "not specified"}
- Belt level (if relevant): ${sanitizePromptText(profile?.belt_level, 30) || "not specified"}

Category averages (1–5 scale):
${Object.entries(scores || {}).map(([k, v]) => `- ${sanitizePromptText(k, 60)}: ${Number(v) || 0}/5`).join("\n")}

Total composite: ${Number(totalScore) || 0}/30

${asUserDataBlock("DETAILED COACH ANSWERS", safeAnswersText, 6000)}

Provide an honest, practical mental review for this coach, focusing on their weakest areas while reinforcing strengths. Remember: the user IS the coach, not an athlete.`;

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
    try { advice = JSON.parse(content); }
    catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, advice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-coach-mental-advice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
