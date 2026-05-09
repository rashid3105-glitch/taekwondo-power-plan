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
      : "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a World Taekwondo (WT) certified performance analyst with deep expertise in kyorugi (Olympic sparring). Analyze match data through WT kyorugi principles: footwork & distance management, cut-kick vs counter timing, scoring zones (body 2pts, head 3pts, turning kicks 4-5pts), gam-jeom prevention, side dominance, energy distribution across rounds, and tactical adjustments.

Write ALL textual content in ${lang}.

Return ONLY a valid JSON object (no markdown fences, no commentary) with this exact structure:
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
Priority must be one of: "high", "medium", "low".`;

    const userPrompt = `Athlete: ${profile?.display_name || "Athlete"}
Belt: ${profile?.belt_level || "n/a"}
Weight: ${profile?.weight_category || "n/a"}

Match: ${video?.title || "Match"}
Discipline: ${video?.discipline || "sparring"}
Opponent: ${video?.opponent_name || "n/a"}
Event: ${video?.event_name || "n/a"}
Date: ${video?.match_date || "n/a"}
Duration: ${video?.duration_seconds ? Math.round(video.duration_seconds) + "s" : "n/a"}

Tags (${tags.length}):
${JSON.stringify(tags, null, 2)}

Provide a detailed WT kyorugi performance report.`;

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
