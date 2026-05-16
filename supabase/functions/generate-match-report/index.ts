import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function ageGroupLabel(ageStr: string | null | undefined): "cadet" | "junior" | "senior" {
  if (!ageStr) return "senior";
  const n = parseInt(String(ageStr), 10);
  if (!Number.isFinite(n)) return "senior";
  if (n <= 13) return "cadet";
  if (n <= 17) return "junior";
  return "senior";
}

function buildSystemPrompt(opts: {
  discipline: string;
  poomsaeType?: string | null;
  ageGroup: "cadet" | "junior" | "senior";
  lang: string;
}): string {
  const { discipline, poomsaeType, ageGroup, lang } = opts;
  const jsonShape = `Return ONLY a valid JSON object (no markdown fences, no commentary) with this exact structure:
{
  "summary": "2-3 sentence overall match summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "technicalAnalysis": {
    "dominantTechniques": "analysis text",
    "sideBalance": "analysis of left/right distribution",
    "scoringPattern": "analysis of scoring efficiency and when points were scored",
    "defensePattern": "analysis of conceded points pattern"
  },
  "recommendations": [
    { "area": "area name", "advice": "specific actionable advice", "priority": "high" }
  ],
  "trainingFocus": ["focus area 1", "focus area 2", "focus area 3"],
  "tacticalNotes": "tactical notes for next match against similar opponent"
}
Priority must be one of: "high", "medium", "low".
Write ALL textual content in ${lang}.`;

  if (discipline === "poomsae") {
    let prompt = `You are a World Taekwondo (WT) certified poomsae judge and performance analyst.

Apply the following WT poomsae judging criteria in your analysis:
- Accuracy (50% of score): correct stances (ap seogi, ap kubi, dwit kubi, etc.), precise hand techniques, exact foot positions, proper height of blocks and strikes, direction changes
- Presentation (50% of score): power (kihap moments, tension/relaxation contrast), speed (rhythm variation between fast and slow movements), expression of energy (ki expression), balance and stability throughout
- Common deductions: loss of balance, incorrect direction, omitted or added movements, stepping outside the performance area
- Cadet rules (≤13): assessed on basic poomsae (Taegeuk 1-8); judges expect clean fundamentals over power
- Junior rules (14-17): expected to demonstrate both accuracy and presentation; power development assessed
- Senior/open rules (18+): full expression expected; all Taegeuk and Palgwe poomsae plus black belt forms

Athlete age category for this performance: ${ageGroup}.

Analyse the tagged video data through these poomsae criteria:
- Technical accuracy: which techniques are tagged as problematic and what corrections are needed per WT standards
- Presentation quality: evidence of power contrast, rhythm, and ki expression in the tags
- Balance and stability: tags indicating loss of balance or unstable stances
- Consistency: are the same techniques repeatedly tagged as issues
- Recommendations must reference specific WT poomsae accuracy and presentation criteria`;

    if (poomsaeType === "pair" || poomsaeType === "team") {
      prompt += `

Additionally, this is a ${poomsaeType === "pair" ? "PAIR" : "TEAM"} poomsae performance. Apply synchronisation judging criteria:
- Synchronisation is a key judging component: all movements must start and finish simultaneously
- Common synchronisation deductions: timing differences in kicks, different stance depths between partners, unsynchronised kihap, inconsistent eye direction
- For TEAM poomsae: formation symmetry and overall visual harmony are also assessed
- Tag analysis should identify which moments show synchronisation issues vs which are individual technique errors
- Recommendations must address both individual corrections and synchronisation drills`;
    }

    return prompt + "\n\n" + jsonShape;
  }

  // Kyorugi (sparring)
  return `You are a World Taekwondo (WT) certified performance analyst specialising in kyorugi (Olympic sparring).

Apply the following WT kyorugi rules in your analysis:
- Match format: 3 rounds × 2 minutes, 1 minute rest, golden point sudden death in case of draw
- Scoring zones: trunk protector (valid scoring area) = 2 points; head = 3 points; turning kick to trunk = 4 points; turning kick to head = 5 points
- Gam-jeom (penalty) deductions: grabbing, pushing, turning back, falling, crossing boundary, attacking below the waist, illegal techniques, passivity — each gam-jeom gives 1 point to the opponent
- Cadet rules (≤13): spinning/turning kicks to the head are NOT allowed; emphasise technical fundamentals and safe execution
- Junior rules (14-17): all techniques allowed; emphasise development of competition patterns and tactical awareness
- Senior/open rules (18+): full WT regulations apply; emphasise tactical efficiency, energy distribution, and high-value technique combinations

Athlete age category for this match: ${ageGroup}. Apply the matching ruleset above.

Analyse the tagged match data through these kyorugi principles:
- Scoring efficiency: ratio of scored to total attacking actions
- Technique value: proportion of high-value techniques (turning kicks, head kicks) vs basic techniques
- Side dominance: is the athlete predictable by always attacking from the same side?
- Defensive patterns: when and how are points being conceded — late in rounds (fatigue), after failed attacks (counter vulnerability), or from gam-jeoms?
- Tactical timing: distribution of tags across the match duration to identify round pacing
- Recommendations must reference specific WT rules and scoring opportunities

${jsonShape}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = (claimsData.claims as any).sub as string;
    const notEntitled = await checkAIEntitlement(userId, corsHeaders);
    if (notEntitled) return notEntitled;

    const raw = await req.text();
    if (raw.length > 50000) {
      return new Response(JSON.stringify({ error: "Request too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { tags, video, profile, language } = JSON.parse(raw);
    if (!Array.isArray(tags) || tags.length === 0) {
      return new Response(JSON.stringify({ error: "No tags provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tags.length > 500) {
      return new Response(JSON.stringify({ error: "Too many tags (max 500)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = language === "da" ? "Danish"
      : language === "sv" ? "Swedish"
      : language === "de" ? "German"
      : language === "ar" ? "Arabic"
      : language === "no" ? "Norwegian Bokmål"
      : language === "es" ? "Spanish (Castilian)"
      : "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const discipline = video?.discipline || "sparring";
    const poomsaeType = video?.poomsae_type || null;
    const ageGroup = ageGroupLabel(video?.athlete_age);

    const systemPrompt = buildSystemPrompt({ discipline, poomsaeType, ageGroup, lang });

    const userPrompt = `Athlete: ${profile?.display_name || "Athlete"}
Belt: ${profile?.belt_level || "n/a"}
Weight: ${profile?.weight_category || "n/a"}
Age: ${video?.athlete_age || "n/a"} (${ageGroup})

Match: ${video?.title || "Match"}
Discipline: ${discipline}${discipline === "poomsae" && poomsaeType ? ` (${poomsaeType})` : ""}
Opponent: ${video?.opponent_name || "n/a"}
Event: ${video?.event_name || "n/a"}
Date: ${video?.match_date || "n/a"}
Duration: ${video?.duration_seconds ? Math.round(video.duration_seconds) + "s" : "n/a"}

Tags (${tags.length}):
${JSON.stringify(tags, null, 2)}

Provide a detailed WT performance report.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("AI gateway error:", response.status, txt);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let report;
    try {
      report = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-match-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
