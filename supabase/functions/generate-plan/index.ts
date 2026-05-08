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
    const { profile, language } = JSON.parse(body);
    if (profile?.current_injury && typeof profile.current_injury === "string" && profile.current_injury.length > 500) {
      return new Response(JSON.stringify({ error: "Injury description too long (max 500 characters)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const lang = language === "da" ? "Danish" : language === "sv" ? "Swedish" : language === "de" ? "German" : language === "ar" ? "Arabic" : "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discipline = profile.discipline || 'sparring';
    const isSparring = discipline === 'sparring';

    const disciplineContext = isSparring
      ? `This athlete is a SPARRING (fighter) specialist. Programs must emphasize:
- Explosive power and speed for kicks, punches, and footwork
- Rate of force development (RFD) for fast-twitch muscle activation
- Reaction time and agility drills
- Combat-specific conditioning (intervals mimicking round structure)
- Ability to absorb and deliver impact
- Quick direction changes and lateral movement`
      : `This athlete is a POOMSAE (forms) specialist. Programs must emphasize:
- Balance, stability, and proprioception
- Controlled strength through full range of motion
- Core stability for stances and transitions
- Flexibility and mobility for aesthetic technique execution
- Muscular endurance for sustained performance
- Precision and body control over raw power
- Slow-tempo strength work for movement quality`;

    const systemPrompt = `You are an expert strength & conditioning coach specializing in taekwondo athletic performance. You create training programs for ${isSparring ? 'SPARRING (fighter)' : 'POOMSAE (forms)'} athletes.

${disciplineContext}

Your programs must:
- Be specific with exercises, sets, reps, tempo, and rest periods
- Fit around the athlete's existing taekwondo schedule
${isSparring
  ? `- Minimize risk of becoming slow or heavy
- Focus on neural drive over hypertrophy (low reps, explosive intent)
- Include injury prevention work (hamstrings, hip flexors, adductors)
- Include mobility work for high kicks`
  : `- Focus on balance and stability exercises
- Include proprioception and body control drills
- Emphasize slow, controlled tempos for strength
- Include extensive flexibility and mobility work
- Build muscular endurance for sustained poomsae performance`}

For each exercise, include:
- Name, sets, reps, tempo (if relevant), rest period
- Brief coaching cue
- Why it matters for ${isSparring ? 'taekwondo sparring' : 'poomsae performance'} specifically
- A category: "power", "speed", "strength", "plyometric", or "mobility"
- Two alternative exercises (with name + brief reason) the athlete can do if the primary exercise isn't possible in their gym

Return a valid JSON object with this exact structure:
{
  "planName": "string",
  "periodization": [
    {
      "phase": "string (e.g. 'Anatomical Adaptation', 'Accumulation', 'Intensification', 'Peaking', 'Deload')",
      "weeks": "string (e.g. '1-3')",
      "startWeek": number,
      "endWeek": number,
      "focus": "string (brief description of what this phase targets)",
      "volumePercent": number (0-100, relative training volume),
      "intensityPercent": number (0-100, relative intensity/load),
      "keyChanges": "string (what changes from previous phase, e.g. 'Add plyometrics, reduce sets by 20%')"
    }
  ],
  "weeklySchedule": [
    {
      "dayOfWeek": "Monday",
      "sessions": [
        {
          "type": "tkd" | "gym" | "recovery",
          "label": "string (e.g. 'Morning Strength' or 'Evening TKD')",
          "focus": "string",
          "exercises": [
            {
              "name": "string",
              "category": "power" | "speed" | "strength" | "plyometric" | "mobility",
              "sets": number,
              "reps": "string",
              "tempo": "string or null",
              "rest": "string",
              "coachingCue": "string",
              "whyItMatters": "string",
              "alternatives": [
                { "name": "string", "reason": "string" },
                { "name": "string", "reason": "string" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT: Each day in weeklySchedule MUST use the "sessions" array format. A day can have ONE or MULTIPLE sessions. For example, a day with both morning gym training and evening TKD would have two session objects in the sessions array. Rest days should have a single session with type "recovery" and an empty exercises array.

The weeklySchedule represents the BASE WEEK template. The periodization array describes how to modify volume/intensity across the entire program duration. Create realistic periodization phases that make sense for the athlete's level and goals.

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no explanatory text.
IMPORTANT: ALL text content (planName, labels, focus descriptions, exercise names where appropriate, coachingCues, whyItMatters, alternative reasons) MUST be written in ${lang}.`;

    const weeklySchedule = profile.weekly_schedule || [];
    const scheduleDescription = weeklySchedule.length > 0
      ? weeklySchedule.map((d: any) => {
          if (d.sessions && d.sessions.length > 1) {
            return `${d.day}: ${d.sessions.map((s: any) => s.type.toUpperCase()).join(' + ')}`;
          }
          return `${d.day}: ${d.type.toUpperCase()}`;
        }).join(', ')
      : 'Not specified';

    const injuryInfo = profile.current_injury ? `\n- Current injury: ${profile.current_injury}` : '';
    const injuryInstructions = profile.current_injury
      ? `\n\nCRITICAL INJURY CONSIDERATION: The athlete has reported "${profile.current_injury}". You MUST:\n1. AVOID all exercises that could aggravate this injury\n2. Include specific rehab/prehab exercises for this injury on gym days\n3. Add coaching cues about pain-free range of motion\n4. Note in whyItMatters when an exercise specifically helps with the injury recovery\n5. Reduce plyometric intensity if the injury involves lower limbs`
      : '';

    const userPrompt = `Create a personalized taekwondo ${isSparring ? 'SPARRING' : 'POOMSAE'} fitness plan for this athlete:
- Discipline: ${isSparring ? 'Sparring (Fighter)' : 'Poomsae (Forms)'}
- Age: ${profile.age || 'not specified'}
- Weight: ${profile.weight_kg ? profile.weight_kg + ' kg' : 'not specified'}
- Belt level: ${profile.belt_level || 'not specified'}
- Years of experience: ${profile.experience_years || 'not specified'}
- TKD sessions per week: ${profile.tkd_sessions_per_week || 3}
- Program length: ${profile.program_weeks || 8} weeks
- Goals: ${profile.goals?.length ? profile.goals.join(', ') : 'general performance improvement'}
- Weekly schedule: ${scheduleDescription}${injuryInfo}

IMPORTANT: Follow the athlete's chosen weekly schedule EXACTLY. Each day's sessions must match the types they selected. If a day has multiple session types (e.g. "Monday: GYM, TKD"), create multiple session objects in the sessions array for that day — for example a morning gym session and an evening TKD session. For TKD sessions, don't list exercises — just label and focus. For Gym sessions, provide full exercise details. For Rest/recovery sessions, suggest light recovery work only.
Design the program for ${profile.program_weeks || 8} weeks with appropriate periodization.${injuryInstructions}`;

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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
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
    console.error("generate-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
