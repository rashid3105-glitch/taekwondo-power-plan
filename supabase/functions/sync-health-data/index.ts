import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RawRecord {
  metric_type: string;
  value: number | null;
  unit?: string;
  start_date: string;
  end_date?: string;
  source_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    const body = await req.json();
    const records: RawRecord[] = body.records ?? [];
    if (!records.length) {
      return new Response(JSON.stringify({ error: "No records" }), { status: 400, headers: cors });
    }

    const capped = records.slice(0, 2000);

    const byDate = new Map<string, {
      steps: number;
      sleepSeconds: number;
      hrReadings: number[];
      rhrReadings: number[];
      hrvReadings: number[];
      distanceMeters: number;
      activeCalories: number;
    }>();

    const getOrInit = (date: string) => {
      if (!byDate.has(date)) {
        byDate.set(date, {
          steps: 0, sleepSeconds: 0, hrReadings: [],
          rhrReadings: [], hrvReadings: [],
          distanceMeters: 0, activeCalories: 0,
        });
      }
      return byDate.get(date)!;
    };

    for (const r of capped) {
      if (r.value == null || r.value < 0) continue;
      const date = r.start_date.slice(0, 10);
      const bucket = getOrInit(date);

      switch (r.metric_type) {
        case "StepCount":
          bucket.steps += r.value;
          break;
        case "SleepAnalysis":
          if (r.unit === "hr" || r.value < 24) {
            bucket.sleepSeconds += r.value * 3600;
          } else {
            bucket.sleepSeconds += r.value;
          }
          break;
        case "HeartRate":
          bucket.hrReadings.push(r.value);
          break;
        case "RestingHeartRate":
          bucket.rhrReadings.push(r.value);
          break;
        case "HeartRateVariabilitySDNN":
          bucket.hrvReadings.push(r.value);
          break;
        case "DistanceWalkingRunning":
          bucket.distanceMeters += r.value;
          break;
        case "ActiveEnergyBurned":
          bucket.activeCalories += r.value;
          break;
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    let upserted = 0;
    for (const [date, b] of byDate.entries()) {
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, c) => a + c, 0) / arr.length : null;

      const heartRateAvg = b.rhrReadings.length
        ? avg(b.rhrReadings)
        : b.hrReadings.length ? avg(b.hrReadings) : null;

      const row = {
        user_id: user.id,
        date,
        steps: b.steps > 0 ? Math.round(b.steps) : null,
        sleep_hours: b.sleepSeconds > 0 ? Math.round((b.sleepSeconds / 3600) * 100) / 100 : null,
        heart_rate_avg: heartRateAvg != null ? Math.round(heartRateAvg * 10) / 10 : null,
        hrv: b.hrvReadings.length ? Math.round(avg(b.hrvReadings)! * 10) / 10 : null,
      };

      if (row.steps == null && row.sleep_hours == null && row.heart_rate_avg == null && row.hrv == null) continue;

      const { error } = await admin
        .from("health_data")
        .upsert(row, { onConflict: "user_id,date" });

      if (!error) upserted++;
      else console.error("upsert failed for", date, error);
    }

    // Fire-and-forget resync into wearable_daily_summary
    fetch(`${SUPABASE_URL}/functions/v1/resync-health`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ days: 30 }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({ success: true, received: capped.length, upserted, athlete_id: user.id }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("sync-health-data error:", e);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(e) }), {
      status: 500, headers: cors,
    });
  }
});
