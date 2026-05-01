// Re-sync HealthBridge data: re-mirror last N days of public.health_data
// into public.wearable_daily_summary, then refresh the 7-day baselines.
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

    // Verify the JWT
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    // Parse optional days param
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

    // Service-role client for the upsert + RPC
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
      const sleepMinutes = r.sleep_hours != null ? Math.round(Number(r.sleep_hours) * 60) : null;
      const steps = r.steps != null ? Math.round(Number(r.steps)) : null;

      // Match the trigger: COALESCE on conflict so manual entries are preserved.
      // We can't express COALESCE via the JS client, so call a tiny inline SQL via RPC?
      // Instead: read existing row, then merge in JS, then upsert.
      const { data: existing } = await admin
        .from("wearable_daily_summary")
        .select("steps, sleep_minutes, resting_hr, hrv_rmssd")
        .eq("user_id", userId)
        .eq("summary_date", r.date)
        .maybeSingle();

      const merged = {
        user_id: userId,
        summary_date: r.date,
        steps: steps ?? existing?.steps ?? 0,
        sleep_minutes: sleepMinutes ?? existing?.sleep_minutes ?? null,
        resting_hr: r.heart_rate_avg ?? existing?.resting_hr ?? null,
        hrv_rmssd: r.hrv ?? existing?.hrv_rmssd ?? null,
        workout_count: 0,
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

    // Refresh the 7-day rolling baselines for the whole window
    const { error: rpcErr } = await admin.rpc("recompute_wearable_summary", {
      _user_id: userId,
      _from: fromStr,
      _to: toStr,
    });
    if (rpcErr) console.error("recompute_wearable_summary failed", rpcErr);

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
