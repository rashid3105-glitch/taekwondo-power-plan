import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert strength & conditioning coach specializing in taekwondo athletic performance. You create training programs that prioritize SPEED, RATE OF FORCE DEVELOPMENT (RFD), and EXPLOSIVENESS while building lean muscle that enhances — never hinders — martial arts performance.

Your programs must:
- Be specific with exercises, sets, reps, tempo, and rest periods
- Fit around the athlete's existing taekwondo schedule
- Minimize risk of becoming slow or heavy
- Focus on neural drive over hypertrophy (low reps, explosive intent)
- Include injury prevention work (hamstrings, hip flexors, adductors)
- Include mobility work for high kicks

For each exercise, include:
- Name, sets, reps, tempo (if relevant), rest period
- Brief coaching cue
- Why it matters for taekwondo specifically
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
      "label": "string (e.g. 'TKD Technical' or 'Power & Explosiveness')",
      "type": "tkd" | "gym" | "recovery",
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

The weeklySchedule represents the BASE WEEK template. The periodization array describes how to modify volume/intensity across the entire program duration. Create realistic periodization phases that make sense for the athlete's level and goals.

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no explanatory text.`;

    const weeklySchedule = profile.weekly_schedule || [];
    const scheduleDescription = weeklySchedule.length > 0
      ? weeklySchedule.map((d: any) => `${d.day}: ${d.type.toUpperCase()}`).join(', ')
      : 'Not specified';

    const injuryInfo = profile.current_injury ? `\n- Current injury: ${profile.current_injury}` : '';
    const injuryInstructions = profile.current_injury
      ? `\n\nCRITICAL INJURY CONSIDERATION: The athlete has reported "${profile.current_injury}". You MUST:\n1. AVOID all exercises that could aggravate this injury\n2. Include specific rehab/prehab exercises for this injury on gym days\n3. Add coaching cues about pain-free range of motion\n4. Note in whyItMatters when an exercise specifically helps with the injury recovery\n5. Reduce plyometric intensity if the injury involves lower limbs`
      : '';

    const userPrompt = `Create a personalized taekwondo fitness plan for this athlete:
- Age: ${profile.age || 'not specified'}
- Weight: ${profile.weight_kg ? profile.weight_kg + ' kg' : 'not specified'}
- Belt level: ${profile.belt_level || 'not specified'}
- Years of experience: ${profile.experience_years || 'not specified'}
- TKD sessions per week: ${profile.tkd_sessions_per_week || 3}
- Program length: ${profile.program_weeks || 8} weeks
- Goals: ${profile.goals?.length ? profile.goals.join(', ') : 'general performance improvement'}
- Weekly schedule: ${scheduleDescription}${injuryInfo}

IMPORTANT: Follow the athlete's chosen weekly schedule EXACTLY. Each day must match the type they selected (TKD, Gym, or Rest). For TKD days, don't list exercises — just label and focus. For Gym days, provide full exercise details. For Rest days, suggest light recovery work only.
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
