import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });

  try {
    const body = await req.json();

    const { email, password, steps, steps_date, resting_hr, resting_hr_date, hrv, hrv_date, sleep_hours, sleep_date } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), { status: 400, headers: cors });
    }

    // Comma-tolerant numeric parser (iOS Shortcuts may send "33,63" in da-DK locale)
    const num = (v: unknown): number | null => {
      if (v == null) return null;
      const n = Number(String(v).trim().replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Step 1 — authenticate
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email, password });
    if (authError || !authData.session) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: cors });
    }

    const userId = authData.user.id;
    const today = new Date().toISOString().slice(0, 10);

    // Step 2 — aggregate into daily buckets
    const byDate: Record<string, { steps: number; sleep_seconds: number; hr: number[]; hrv_vals: number[] }> = {};

    const ensure = (d: string) => {
      if (!byDate[d]) byDate[d] = { steps: 0, sleep_seconds: 0, hr: [], hrv_vals: [] };
    };

    const s = num(steps);
    if (s != null) {
      const d = steps_date ?? today;
      ensure(d);
      byDate[d].steps += s;
    }
    const rh = num(resting_hr);
    if (rh != null) {
      const d = resting_hr_date ?? today;
      ensure(d);
      byDate[d].hr.push(rh);
    }
    const hv = num(hrv);
    if (hv != null) {
      const d = hrv_date ?? today;
      ensure(d);
      byDate[d].hrv_vals.push(hv);
    }
    const sl = num(sleep_hours);
    if (sl != null) {
      const d = sleep_date ?? today;
      ensure(d);
      byDate[d].sleep_seconds += sl * 3600;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    let upserted = 0;
    for (const [date, b] of Object.entries(byDate)) {
      const patch: Record<string, number> = {};
      if (b.steps > 0) patch.steps = Math.round(b.steps);
      if (b.sleep_seconds > 0) patch.sleep_hours = Math.round((b.sleep_seconds / 3600) * 100) / 100;
      if (b.hr.length) patch.heart_rate_avg = Math.round(avg(b.hr)! * 10) / 10;
      if (b.hrv_vals.length) patch.hrv = Math.round(avg(b.hrv_vals)! * 10) / 10;

      if (Object.keys(patch).length === 0) continue;

      const { data: existing } = await admin
        .from("health_data")
        .select("id")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await admin
          .from("health_data")
          .update(patch)
          .eq("user_id", userId)
          .eq("date", date));
      } else {
        ({ error } = await admin
          .from("health_data")
          .insert({ user_id: userId, date, ...patch }));
      }
      if (!error) upserted++;
    }

    // Step 3 — trigger resync
    await fetch(`${SUPABASE_URL}/functions/v1/resync-health`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authData.session.access_token}`, "Content-Type": "application/json", apikey: ANON_KEY },
      body: JSON.stringify({ days: 30 }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true, upserted, user: authData.user.email }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );

  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
