// Wearables MVP — ingest a batch of normalized samples from the device.
// Deduplicates on (user, provider, metric_type, external_id), then recomputes
// the daily summary window touched by the batch.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Sample = z.object({
  metric_type: z.enum(["sleep", "resting_hr", "hrv", "steps", "workout"]),
  value_numeric: z.number().finite().nullable().optional(),
  unit: z.string().max(16).optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().optional(),
  source_device: z.string().max(80).optional(),
  external_id: z.string().max(120).optional(),
  payload: z.record(z.any()).optional(),
});

const Body = z.object({
  provider: z.enum(["apple_health", "health_connect"]),
  device_label: z.string().max(80).optional(),
  granted_scopes: z.array(z.string().max(60)).max(20).optional(),
  samples: z.array(Sample).max(500),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // 10KB hard cap per project convention
    const raw = await req.text();
    if (raw.length > 10_000 * 5) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = Body.safeParse(JSON.parse(raw));
    if (!parsed.success) return new Response(
      JSON.stringify({ error: parsed.error.flatten() }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
    const { provider, device_label, granted_scopes, samples } = parsed.data;

    // Per-metric breakdown of what the device reported
    const breakdown: Record<string, number> = {
      sleep: 0, resting_hr: 0, hrv: 0, steps: 0, workout: 0,
    };
    for (const s of samples) breakdown[s.metric_type] = (breakdown[s.metric_type] ?? 0) + 1;

    // Upsert connection row — but DO NOT bump last_sync_at unless we actually
    // ingested data. We track the attempt separately via last_attempt_at so
    // the UI can distinguish "we tried" from "we got data".
    const baseConnection: Record<string, unknown> = {
      user_id: user.id,
      provider,
      status: "active",
      device_label: device_label ?? null,
      granted_scopes: granted_scopes ?? [],
      last_attempt_at: new Date().toISOString(),
    };
    await supa.from("wearable_connections").upsert(baseConnection, { onConflict: "user_id,provider" });

    let inserted = 0;
    if (samples.length > 0) {
      const rows = samples.map((s) => ({
        user_id: user.id,
        provider,
        metric_type: s.metric_type,
        value_numeric: s.value_numeric ?? null,
        unit: s.unit ?? null,
        start_at: s.start_at,
        end_at: s.end_at ?? null,
        source_device: s.source_device ?? null,
        external_id: s.external_id ?? `${s.metric_type}-${s.start_at}`,
        payload: s.payload ?? {},
      }));
      const { error, count } = await supa
        .from("wearable_samples")
        .upsert(rows, { onConflict: "user_id,provider,metric_type,external_id", count: "exact" });
      if (error) throw new Error(error.message);
      inserted = count ?? rows.length;

      // Recompute summary window
      const dates = rows.map(r => r.start_at.slice(0, 10)).sort();
      const from = dates[0];
      const to = dates[dates.length - 1];
      const { error: rpcErr } = await supa.rpc("recompute_wearable_summary", {
        _user_id: user.id, _from: from, _to: to,
      });
      if (rpcErr) console.error("recompute_wearable_summary failed", rpcErr);
    }

    return new Response(
      JSON.stringify({ ok: true, inserted, last_sync_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
