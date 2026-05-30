import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";
import { sanitizePromptText } from "../_shared/sanitizePrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Metric {
  name: string;
  unit: string;
  avg14: number | null;
  last: number | null;
  daysWithData: number;
  ageNorm: { target: number; bandLow: number; bandHigh: number };
  verdict: "low" | "in" | "high" | null;
}

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
    const notEntitled = await checkAIEntitlement(userData.user.id, corsHeaders);
    if (notEntitled) return notEntitled;

    const raw = await req.text();
    if (raw.length > 10000) {
      return new Response(JSON.stringify({ error: "Request too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { age, ageLabel, metrics, language } = JSON.parse(raw) as {
      age: number | null;
      ageLabel: string;
      metrics: Metric[];
      language?: string;
    };

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return new Response(JSON.stringify({ error: "Missing metrics" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lang = language === "da" ? "Danish"
      : language === "sv" ? "Swedish"
      : language === "de" ? "German"
      : language === "ar" ? "Arabic"
      : language === "no" ? "Norwegian (Bokmål)"
      : language === "fa" ? "English (the athlete's UI is Farsi but the report is in English)"
      : "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lines = metrics.map((m) => {
      const unit = sanitizePromptText(m.unit, 20);
      const name = sanitizePromptText(m.name, 60);
      const verdict = sanitizePromptText(m.verdict ?? "unknown", 20);
      const avg = m.avg14 == null ? "no data" : `${Number(m.avg14)}${unit}`;
      const last = m.last == null ? "no data" : `${Number(m.last)}${unit}`;
      const norm = `peer band ${Number(m.ageNorm.bandLow)}–${Number(m.ageNorm.bandHigh)}${unit} (target ${Number(m.ageNorm.target)}${unit})`;
      return `- ${name}: 14-day avg ${avg}, latest ${last}, ${Number(m.daysWithData)} days logged. ${norm}. Verdict: ${verdict}.`;
    }).join("\n");
    const safeAgeLabel = sanitizePromptText(ageLabel, 40);

    const systemPrompt = `You are a sports-science recovery analyst. Write a short, factual health report for a taekwondo athlete based on 14 days of wearable data compared to age-matched general-population norms (NSF sleep guidelines, AHA resting HR, RMSSD HRV reference). Respond in ${lang}.

Return STRICT JSON only with this shape (no markdown, no code fences):
{
  "summary": "2-3 sentences: overall recovery state for the last 14 days.",
  "highlights": ["3-5 short bullet points calling out the most important findings vs the age norm"],
  "recommendations": ["3-5 concrete, actionable suggestions for the next 2 weeks"],
  "watchOuts": ["0-3 things to monitor or red flags; empty array if none"]
}

Rules:
- Compare each metric to the provided peer band. Trained athletes commonly fall below the general-population RHR band and above the HRV band — call those out as positive when relevant.
- Never invent values. If a metric has no data, say so.
- Keep bullets under 22 words each.
- Do not diagnose medical conditions.`;

    const userPrompt = `Athlete age: ${age ?? "unknown"} (peer group ${ageLabel}).
Last 14 days summary:
${lines}

Write the report now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let report;
    try {
      report = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-health-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
