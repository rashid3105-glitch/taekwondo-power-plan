// Generate a monthly development report for one athlete.
// Coach-only feature: framed as an experienced head-coach summary.
// User-facing text NEVER mentions "AI" — outputs are post-processed to strip the word if present.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  da: "Danish",
  sv: "Swedish",
  de: "German",
  ar: "Arabic",
  no: "Norwegian (Bokmål)",
  es: "Spanish (Castilian)",
};

function stripAiMentions(text: string): string {
  if (!text) return text;
  // Remove any client-facing mentions of "AI" / "A.I." / "artificial intelligence"
  return text
    .replace(/\bA\.?I\.?\b/g, "the system")
    .replace(/\bartificial intelligence\b/gi, "the system")
    .replace(/\bAI[- ]?generated\b/gi, "automated")
    .replace(/\s{2,}/g, " ");
}

function periodBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const prevStart = new Date(Date.UTC(year, month - 2, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    prevStart: prevStart.toISOString().slice(0, 10),
    prevEnd: start.toISOString().slice(0, 10),
  };
}

async function collectMetrics(
  admin: ReturnType<typeof createClient>,
  athleteId: string,
  year: number,
  month: number,
) {
  const { start, end, prevStart, prevEnd } = periodBounds(year, month);

  const [diary, workouts, mental, mentalPrev, tests, testsPrev, wearable] =
    await Promise.all([
      admin
        .from("diary_entries")
        .select("id, entry_date, mood, energy, entry_type")
        .eq("user_id", athleteId)
        .gte("entry_date", start)
        .lt("entry_date", end),
      admin
        .from("workout_logs")
        .select("id, logged_date, completed, entry_type")
        .eq("user_id", athleteId)
        .gte("logged_date", start)
        .lt("logged_date", end),
      admin
        .from("mental_assessments")
        .select("id, created_at, scores, total_score")
        .eq("user_id", athleteId)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false }),
      admin
        .from("mental_assessments")
        .select("id, created_at, scores, total_score")
        .eq("user_id", athleteId)
        .gte("created_at", prevStart)
        .lt("created_at", prevEnd)
        .order("created_at", { ascending: false })
        .limit(1),
      admin
        .from("physical_test_results")
        .select("test_name, value, unit, category, test_date")
        .eq("user_id", athleteId)
        .gte("test_date", start)
        .lt("test_date", end),
      admin
        .from("physical_test_results")
        .select("test_name, value, unit, test_date")
        .eq("user_id", athleteId)
        .lt("test_date", start),
      admin
        .from("wearable_daily_summary")
        .select("summary_date, sleep_minutes, resting_hr, hrv_rmssd, steps")
        .eq("user_id", athleteId)
        .gte("summary_date", start)
        .lt("summary_date", end),
    ]);

  const diaryRows = (diary.data as any[]) || [];
  const workoutRows = ((workouts.data as any[]) || []).filter((w) => w.completed);
  const mentalRows = (mental.data as any[]) || [];
  const mentalPrevRow = ((mentalPrev.data as any[]) || [])[0] || null;
  const testRows = (tests.data as any[]) || [];
  const testPrevRows = (testsPrev.data as any[]) || [];
  const wearableRows = (wearable.data as any[]) || [];

  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  const moodAvg = avg(diaryRows.map((d) => Number(d.mood)).filter((n) => !isNaN(n)));
  const energyAvg = avg(
    diaryRows.map((d) => Number(d.energy)).filter((n) => !isNaN(n)),
  );

  // Workout type breakdown
  const sessionsByType: Record<string, number> = {};
  for (const w of workoutRows) {
    const k = String(w.entry_type || "session");
    sessionsByType[k] = (sessionsByType[k] || 0) + 1;
  }

  // Mental score: average and delta
  const latestMental = mentalRows[0] || null;
  const mentalScore =
    latestMental && typeof latestMental.total_score === "number"
      ? latestMental.total_score
      : null;
  const mentalDelta =
    mentalScore != null && mentalPrevRow?.total_score != null
      ? mentalScore - Number(mentalPrevRow.total_score)
      : null;

  // Physical test improvements
  const prevBest = new Map<string, number>();
  for (const t of testPrevRows) {
    const cur = prevBest.get(t.test_name);
    if (cur == null || Number(t.value) > cur) prevBest.set(t.test_name, Number(t.value));
  }
  const testImprovements = testRows.map((t) => ({
    test_name: t.test_name,
    value: Number(t.value),
    unit: t.unit,
    delta: prevBest.has(t.test_name)
      ? Number(t.value) - (prevBest.get(t.test_name) as number)
      : null,
  }));

  // Wearable
  let wearableSummary: any = null;
  if (wearableRows.length > 0) {
    const sleeps = wearableRows.map((r) => r.sleep_minutes).filter((n) => n != null) as number[];
    const hrs = wearableRows.map((r) => r.resting_hr).filter((n) => n != null) as number[];
    const hrvs = wearableRows.map((r) => r.hrv_rmssd).filter((n) => n != null) as number[];
    const steps = wearableRows.map((r) => r.steps).filter((n) => n != null) as number[];
    wearableSummary = {
      days_with_data: wearableRows.length,
      avg_sleep_minutes: avg(sleeps),
      avg_resting_hr: avg(hrs),
      avg_hrv_rmssd: avg(hrvs),
      avg_steps: avg(steps),
    };
  }

  // Diary entry-type breakdown so the LLM knows what was actually logged
  const diaryByType: Record<string, number> = {};
  for (const d of diaryRows) {
    const k = String(d.entry_type || "general");
    diaryByType[k] = (diaryByType[k] || 0) + 1;
  }

  return {
    period: { year, month, start, end },
    diary: {
      entries: diaryRows.length,
      avg_mood: moodAvg,
      avg_energy: energyAvg,
      by_type: diaryByType,
      injury_entries: diaryByType["injury"] || 0,
    },
    training: {
      sessions_completed: workoutRows.length,
      by_type: sessionsByType,
    },
    mental: latestMental
      ? {
          total_score: mentalScore,
          delta_vs_previous: mentalDelta,
          scores: latestMental.scores || null,
          assessments_in_month: mentalRows.length,
        }
      : null,
    physical_tests: testImprovements,
    wearable: wearableSummary,
  };
}

async function callLLM(metrics: any, athleteName: string, locale: string) {
  const langName = LANG_NAMES[locale] || "Danish";
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const systemPrompt = `You are an experienced head coach in elite combat sports writing a private monthly development report ABOUT one of your athletes, addressed to a fellow coach. Tone: senior head coach reviewing the month — sober, specific, warm but direct. No machine-speak, no meta-language about data or models, no buzzwords. Never use the letters "AI" or the word "automatically generated". Write 4–8 short paragraphs in ${langName}. End with 2–3 concrete focus points for the coming month as a short bulleted list (use "- " bullets).

Cover, when data is present:
1) Training volume & rhythm
2) Mental state and confidence trend
3) Physical test progression
4) Daily life signals (diary mood/energy) and recovery indicators (sleep/HRV/resting HR) — only if wearable data exists; otherwise skip this entirely without mentioning the absence.

Do not invent numbers. Do NOT invent topics that are not in the data — in particular: never mention injuries, illness, family events, school, weight changes, or competitions unless those topics are explicitly present in the JSON (e.g. diary.injury_entries > 0, or a competition entry is listed). If diary.injury_entries is 0, do not write about injuries at all. Refer to the athlete by first name only.`;

  const userPrompt = `Athlete first name: ${athleteName}
Period: ${metrics.period.year}-${String(metrics.period.month).padStart(2, "0")}

Structured month data (JSON):
${JSON.stringify(metrics, null, 2)}

Write the monthly development report now in ${langName}.`;

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
    const txt = await response.text();
    throw new Error(`LLM error ${response.status}: ${txt.slice(0, 200)}`);
  }
  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";
  return stripAiMentions(String(raw).trim());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const athleteId = String(body?.athlete_user_id || "");
    const year = Number(body?.year);
    const month = Number(body?.month);
    const force = Boolean(body?.force);

    if (!/^[0-9a-f-]{36}$/i.test(athleteId) || !year || !month || month < 1 || month > 12) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorize: service-role token OR coach for this athlete
    const isServiceRole = token === SERVICE_KEY;
    let callerId: string | null = null;
    if (!isServiceRole) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser(token);
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerId = userData.user.id;
      const { data: link } = await admin
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", callerId)
        .eq("athlete_id", athleteId)
        .maybeSingle();
      const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: callerId });
      if (!link && !isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Idempotency: skip if report already exists with non-empty summary, unless force
    if (!force) {
      const { data: existing } = await admin
        .from("monthly_development_reports")
        .select("id, summary_text")
        .eq("athlete_user_id", athleteId)
        .eq("period_year", year)
        .eq("period_month", month)
        .maybeSingle();
      if (existing && existing.summary_text && existing.summary_text.length > 50) {
        return new Response(JSON.stringify({ success: true, skipped: true, id: existing.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch profile for locale + display name + club
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, default_locale, club_id")
      .eq("user_id", athleteId)
      .maybeSingle();

    const locale = (profile?.default_locale as string) || "da";
    const firstName = (profile?.display_name || "").split(" ")[0] || "athlete";

    const metrics = await collectMetrics(admin, athleteId, year, month);
    const summary = await callLLM(metrics, firstName, locale);

    const { data: upserted, error: upsertErr } = await admin
      .from("monthly_development_reports")
      .upsert(
        {
          athlete_user_id: athleteId,
          club_id: profile?.club_id ?? null,
          period_year: year,
          period_month: month,
          summary_text: summary,
          metrics,
          locale,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "athlete_user_id,period_year,period_month" },
      )
      .select("id")
      .single();

    if (upsertErr) throw upsertErr;

    // Bump unread badge for each linked coach (best-effort)
    try {
      const { data: coachLinks } = await admin
        .from("coach_athletes")
        .select("coach_id")
        .eq("athlete_id", athleteId);
      const coachIds = ((coachLinks as any[]) || []).map((r) => r.coach_id).filter(Boolean);
      if (coachIds.length > 0) {
        // Increment counter individually to avoid race; small N.
        await Promise.all(
          coachIds.map((cid) =>
            admin.rpc as any, // no-op placeholder
            admin
              .from("profiles")
              .select("coach_unread_reports_count")
              .eq("user_id", cid)
              .maybeSingle()
              .then(({ data }) => {
                const next = ((data as any)?.coach_unread_reports_count || 0) + 1;
                return admin
                  .from("profiles")
                  .update({ coach_unread_reports_count: next })
                  .eq("user_id", cid);
              }),
          ),
        );
      }
    } catch (e) {
      console.error("badge bump failed", e);
    }

    return new Response(
      JSON.stringify({ success: true, id: upserted?.id, metrics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-monthly-report error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
