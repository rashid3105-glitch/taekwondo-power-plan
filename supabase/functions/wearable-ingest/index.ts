// Ingest HealthKit samples from the iOS app and aggregate into the existing
// wearable_daily_summary via public.recompute_wearable_summary.
//
// V1 scope: pure observations. No score, no recommendation, no color coding.
// The client sends the last N days of HealthKit samples on each sync; we
// upsert idempotently by (user_id, provider, metric_type, external_id).
//
// Workouts (metric_type='workout') additionally create a workout_logs row
// with wearable_source='apple_health', deduped via
// (user_id, wearable_source, external_id). No plan matching in V1.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SampleIn = {
  metric_type:
    | "sleep"
    | "resting_hr"
    | "hrv"
    | "heart_rate"
    | "active_energy"
    | "workout";
  value_numeric?: number | null;
  unit?: string | null;
  start_at: string;
  end_at?: string | null;
  source_device?: string | null;
  external_id?: string | null;
  payload?: Record<string, unknown> | null;
};

const ALLOWED = new Set([
  "sleep",
  "resting_hr",
  "hrv",
  "heart_rate",
  "active_energy",
  "steps",
  "workout",
]);

function isoDate(v: string): string {
  return v.slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ error: "unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userRes.user) return json({ error: "unauthorized" }, 401);
    const userId = userRes.user.id;

    const body = await req.json().catch(() => null);
    const samples: SampleIn[] = Array.isArray(body?.samples) ? body.samples : [];
    const deviceLabel: string | null = body?.device_label ?? null;
    const grantedScopes: string[] = Array.isArray(body?.granted_scopes)
      ? body.granted_scopes
      : [];
    // Provider defaults to apple_health for backwards compatibility with the
    // iOS client shipped before Android/Health Connect existed.
    const provider: string =
      typeof body?.provider === "string" && body.provider.length > 0
        ? body.provider
        : "apple_health";

    if (samples.length === 0) {
      return json({ inserted: 0, workouts_inserted: 0 });
    }
    if (samples.length > 5000) {
      return json({ error: "batch_too_large", max: 5000 }, 400);
    }

    // Validate and normalize
    const rows: any[] = [];
    const workoutRows: any[] = [];
    const affectedDates = new Set<string>();
    for (const s of samples) {
      if (!s || !ALLOWED.has(s.metric_type)) continue;
      if (!s.start_at || Number.isNaN(Date.parse(s.start_at))) continue;
      rows.push({
        user_id: userId,
        provider,
        metric_type: s.metric_type,
        value_numeric: s.value_numeric ?? null,
        unit: s.unit ?? null,
        start_at: s.start_at,
        end_at: s.end_at ?? null,
        source_device: s.source_device ?? deviceLabel,
        external_id: s.external_id ?? null,
        payload: s.payload ?? {},
      });
      affectedDates.add(isoDate(s.start_at));

      if (s.metric_type === "workout") {
        const p = (s.payload ?? {}) as Record<string, any>;
        const durationMin =
          typeof p.duration_minutes === "number"
            ? Math.round(p.duration_minutes)
            : s.end_at
              ? Math.max(
                  1,
                  Math.round(
                    (Date.parse(s.end_at) - Date.parse(s.start_at)) / 60000,
                  ),
                )
              : null;
        workoutRows.push({
          user_id: userId,
          wearable_source: provider,
          external_id: s.external_id ?? null,
          entry_type: "wearable",
          completed: true,
          logged_date: isoDate(s.start_at),
          activity_label: p.activity_label ?? null,
          avg_hr: p.avg_hr ?? null,
          max_hr: p.max_hr ?? null,
          duration_minutes: durationMin,
          calories: p.calories ?? s.value_numeric ?? null,
        });
      }
    }

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    let inserted = 0;
    if (rows.length > 0) {
      // Split into rows with external_id (idempotent upsert) and rows without
      // (plain insert; caller shouldn't send these repeatedly).
      const withExt = rows.filter((r) => r.external_id);
      const withoutExt = rows.filter((r) => !r.external_id);

      if (withExt.length > 0) {
        const { data, error } = await svc
          .from("wearable_samples")
          .upsert(withExt, {
            onConflict: "user_id,provider,metric_type,external_id",
            ignoreDuplicates: true,
          })
          .select("id");
        if (error) throw error;
        inserted += data?.length ?? 0;
      }
      if (withoutExt.length > 0) {
        const { data, error } = await svc
          .from("wearable_samples")
          .insert(withoutExt)
          .select("id");
        if (error) throw error;
        inserted += data?.length ?? 0;
      }
    }

    let workoutsInserted = 0;
    if (workoutRows.length > 0) {
      const withExt = workoutRows.filter((r) => r.external_id);
      const withoutExt = workoutRows.filter((r) => !r.external_id);
      if (withExt.length > 0) {
        const { data, error } = await svc
          .from("workout_logs")
          .upsert(withExt, {
            onConflict: "user_id,wearable_source,external_id",
            ignoreDuplicates: true,
          })
          .select("id");
        if (error) throw error;
        workoutsInserted += data?.length ?? 0;
      }
      if (withoutExt.length > 0) {
        const { data, error } = await svc
          .from("workout_logs")
          .insert(withoutExt)
          .select("id");
        if (error) throw error;
        workoutsInserted += data?.length ?? 0;
      }
    }

    // Recompute daily summary + 7-day baselines for the affected window,
    // BUT only over dates where we actually ingested samples so Shortcut-only
    // users' summaries stay untouched.
    if (affectedDates.size > 0) {
      const sorted = Array.from(affectedDates).sort();
      const from = sorted[0];
      const to = sorted[sorted.length - 1];
      const { error } = await svc.rpc("recompute_wearable_summary", {
        _user_id: userId,
        _from: from,
        _to: to,
      });
      if (error) console.error("recompute failed", error);
    }

    // Upsert wearable_connections row for this provider.
    const { data: existing } = await svc
      .from("wearable_connections")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();
    if (existing) {
      await svc
        .from("wearable_connections")
        .update({
          status: "connected",
          last_sync_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
          device_label: deviceLabel ?? undefined,
          granted_scopes: grantedScopes.length > 0 ? grantedScopes : undefined,
        })
        .eq("id", existing.id);
    } else {
      await svc.from("wearable_connections").insert({
        user_id: userId,
        provider,
        status: "connected",
        last_sync_at: new Date().toISOString(),
        last_attempt_at: new Date().toISOString(),
        device_label: deviceLabel,
        granted_scopes: grantedScopes,
      });
    }


    return json({
      inserted,
      workouts_inserted: workoutsInserted,
      dates: affectedDates.size,
    });
  } catch (err) {
    console.error("wearable-ingest error", err);
    return json({ error: String((err as Error).message ?? err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
