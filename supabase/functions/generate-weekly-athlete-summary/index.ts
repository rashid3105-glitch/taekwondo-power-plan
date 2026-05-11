// Generates a short, shareable weekly summary for one athlete based on
// diary entries, readiness check-ins and workout completion for the week.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkAIEntitlement } from "../_shared/checkEntitlement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = (claimsData.claims as any).sub as string;
    const notEntitled = await checkAIEntitlement(userId, corsHeaders);
    if (notEntitled) return notEntitled;

    const raw = await req.text();
    if (raw.length > 20000) return json({ error: "Request too large" }, 400);
    const { athlete, week, diary, readiness, workoutCompletion, language } = JSON.parse(raw);

    if (!athlete?.display_name || !week?.start || !week?.end) {
      return json({ error: "Missing athlete or week" }, 400);
    }

    const lang =
      language === "da" ? "Danish" :
      language === "sv" ? "Swedish" :
      language === "de" ? "German" :
      language === "ar" ? "Arabic" :
      language === "no" ? "Norwegian (Bokmål)" :
      "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a supportive, professional taekwondo coach assistant writing a weekly athlete summary that the coach can share directly with the athlete.

Tone: warm, direct, constructive. Maximum 4 sentences. Written to the athlete in second person ("you").

Structure — cover all that are available from the data:
1. Overall week assessment (training load + completion)
2. Mental/physical wellbeing trend (from diary + readiness)
3. One specific strength or positive observation
4. One concrete, actionable recommendation for next week

If data is sparse (fewer than 2 diary entries and no readiness), write a brief encouraging summary based only on training completion.

Write the entire response in ${lang}. Return ONLY the summary text — no JSON, no headers, no bullet points.`;

    const diaryArr = Array.isArray(diary) ? diary : [];
    const readinessArr = Array.isArray(readiness) ? readiness : [];
    const workoutArr = Array.isArray(workoutCompletion) ? workoutCompletion : [];

    const diaryText = diaryArr.length === 0 ? "(none)" :
      diaryArr.map((d: any) =>
        `- ${d.entry_date} [${d.entry_type}] mood ${d.mood}/5, energy ${d.energy}/5${d.tags?.length ? ` (${d.tags.join(", ")})` : ""}: ${(d.content || "").slice(0, 240)}`
      ).join("\n");

    const readinessText = readinessArr.length === 0 ? "(none)" :
      readinessArr.map((r: any) =>
        `- ${r.date} mood ${r.mood}, energy ${r.energy ?? "n/a"}, sleep ${r.sleep_hours}h${r.notes ? ` — ${r.notes}` : ""}`
      ).join("\n");

    const workoutText = workoutArr.length === 0 ? "(none)" :
      workoutArr.map((w: any) =>
        `- ${w.date} ${w.session_type || ""}: ${w.completed}/${w.total} exercises completed`
      ).join("\n");

    const userPrompt = `Athlete: ${athlete.display_name} (${athlete.belt_level || "—"}${athlete.weight_category ? `, ${athlete.weight_category}` : ""})
Week: ${week.start} → ${week.end}

Diary entries:
${diaryText}

Readiness check-ins:
${readinessText}

Workout completion:
${workoutText}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      if (response.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return json({ error: "AI service error" }, 500);
    }

    const data = await response.json();
    const summary = (data.choices?.[0]?.message?.content || "").trim();
    return json({ summary });
  } catch (e) {
    console.error("generate-weekly-athlete-summary error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
