// Re-sync HealthBridge data: re-mirror last N days of public.health_data
// into public.wearable_daily_summary using strictly additive COALESCE,
// then refresh ONLY the 7-day baselines (never overwrite real metrics).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    let days = 30;
    try {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body.days === "number" && body.days >= 1 && body.days <= 90) {
        days = Math.floor(body.days);
      }
    } catch (_) { /* empty body */ }

    const today = new Date();
    const from = new Date(today.getTime() - days * 86400000);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Pull raw HealthKit rows
    const { data: rows, error: readErr } = await admin
      .from("health_data")
      .select("date, steps, sleep_hours, heart_rate_avg, hrv")
      .eq("user_id", userId)
      .gte("date", fromStr)
      .lte("date", toStr);

    if (readErr) {
      console.error("read health_data failed", readErr);
      return json({ error: readErr.message }, 500);
    }

    let mirrored = 0;
    for (const r of rows ?? []) {
      // Treat 0 as "no signal" for steps and sleep so we never wipe a real
      // value with an empty iPhone payload.
      const incomingSteps =
        r.steps != null && Number(r.steps) > 0 ? Math.round(Number(r.steps)) : null;
      const incomingSleepMinutes =
        r.sleep_hours != null && Number(r.sleep_hours) > 0
          ? Math.round(Number(r.sleep_hours) * 60)
          : null;
      const incomingHr = r.heart_rate_avg != null ? Number(r.heart_rate_avg) : null;
      const incomingHrv = r.hrv != null ? Number(r.hrv) : null;

      // If the iPhone row has nothing useful at all, skip it entirely.
      if (
        incomingSteps == null &&
        incomingSleepMinutes == null &&
        incomingHr == null &&
        incomingHrv == null
      ) {
        continue;
      }

      const { data: existing } = await admin
        .from("wearable_daily_summary")
        .select("steps, sleep_minutes, resting_hr, hrv_rmssd, workout_count")
        .eq("user_id", userId)
        .eq("summary_date", r.date)
        .maybeSingle();

      // Strictly additive merge: incoming wins only when it has a real value.
      // Existing real values are preserved; never demote a non-zero to zero.
      const mergedSteps =
        incomingSteps != null
          ? Math.max(incomingSteps, existing?.steps ?? 0)
          : existing?.steps ?? null;
      const mergedSleep =
        incomingSleepMinutes ?? existing?.sleep_minutes ?? null;
      const mergedHr = incomingHr ?? existing?.resting_hr ?? null;
      const mergedHrv = incomingHrv ?? existing?.hrv_rmssd ?? null;

      const merged = {
        user_id: userId,
        summary_date: r.date,
        steps: mergedSteps,
        sleep_minutes: mergedSleep,
        resting_hr: mergedHr,
        hrv_rmssd: mergedHrv,
        workout_count: existing?.workout_count ?? 0,
        computed_at: new Date().toISOString(),
      };

      const { error: upErr } = await admin
        .from("wearable_daily_summary")
        .upsert(merged, { onConflict: "user_id,summary_date" });

      if (upErr) {
        console.error("upsert failed for", r.date, upErr);
        continue;
      }
      mirrored++;
    }

    // Refresh ONLY the 7-day rolling baselines for the affected window.
    // We deliberately do NOT call recompute_wearable_summary here — that RPC
    // overwrites steps/sleep/hr/hrv from the (often empty) wearable_samples
    // table, which destroys the values we just mirrored.
    const { data: windowRows, error: winErr } = await admin
      .from("wearable_daily_summary")
      .select("summary_date, resting_hr, hrv_rmssd")
      .eq("user_id", userId)
      .gte("summary_date", fromStr)
      .lte("summary_date", toStr)
      .order("summary_date", { ascending: true });

    if (!winErr && windowRows) {
      // Compute 7-day trailing average for hr/hrv per date and update in place.
      for (let i = 0; i < windowRows.length; i++) {
        const cur = windowRows[i];
        const curDate = new Date(cur.summary_date as string);
        const windowStart = new Date(curDate.getTime() - 7 * 86400000);
        const trailing = windowRows.filter((w) => {
          const d = new Date(w.summary_date as string);
          return d >= windowStart && d < curDate;
        });
        const hrVals = trailing
          .map((w) => (w.resting_hr != null ? Number(w.resting_hr) : null))
          .filter((v): v is number => v != null);
        const hrvVals = trailing
          .map((w) => (w.hrv_rmssd != null ? Number(w.hrv_rmssd) : null))
          .filter((v): v is number => v != null);
        const baseHr =
          hrVals.length > 0 ? hrVals.reduce((a, b) => a + b, 0) / hrVals.length : null;
        const baseHrv =
          hrvVals.length > 0
            ? hrvVals.reduce((a, b) => a + b, 0) / hrvVals.length
            : null;

        await admin
          .from("wearable_daily_summary")
          .update({
            baseline_hr_7d: baseHr,
            baseline_hrv_7d: baseHrv,
          })
          .eq("user_id", userId)
          .eq("summary_date", cur.summary_date as string);
      }
    } else if (winErr) {
      console.error("window read failed", winErr);
    }

    return json({
      ok: true,
      days_synced: mirrored,
      from: fromStr,
      to: toStr,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
