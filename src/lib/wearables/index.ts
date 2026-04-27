// Thin platform-branched wrapper around HealthKit (iOS) / Health Connect (Android).
// Web users get a stub that reports "unsupported". Native plugins are loaded
// dynamically so the web build stays lean and doesn't fail when they're absent.
import { supabase } from "@/integrations/supabase/client";

export type WearableProvider = "apple_health" | "health_connect";
export type WearableMetric = "sleep" | "resting_hr" | "hrv" | "steps" | "workout";

export interface WearableSample {
  metric_type: WearableMetric;
  value_numeric?: number | null;
  unit?: string;
  start_at: string;       // ISO
  end_at?: string;        // ISO
  source_device?: string;
  external_id?: string;
  payload?: Record<string, unknown>;
}

export interface WearableStatus {
  provider: WearableProvider | null;
  connected: boolean;
  last_sync_at: string | null;
  device_label: string | null;
}

function detectPlatform(): "ios" | "android" | "web" {
  if (typeof navigator === "undefined") return "web";
  const cap = (globalThis as any).Capacitor;
  if (cap?.getPlatform) {
    const p = cap.getPlatform();
    if (p === "ios" || p === "android") return p;
  }
  return "web";
}

export function wearableProviderForPlatform(): WearableProvider | null {
  const p = detectPlatform();
  if (p === "ios") return "apple_health";
  if (p === "android") return "health_connect";
  return null;
}

export function isWearableSupported(): boolean {
  return wearableProviderForPlatform() !== null;
}

// ============================================================================
// Native plugin bridge (Capacitor)
// ----------------------------------------------------------------------------
// We dynamically import community plugins so the web bundle never tries to
// resolve native modules. The plugins expose roughly the same surface for
// HealthKit and Health Connect, so we normalise the response to WearableSample.
// ============================================================================
type RawNativeSample = {
  startDate: string; endDate?: string;
  value?: number; unit?: string;
  sourceName?: string; uuid?: string;
};

async function loadNativePlugin(): Promise<any | null> {
  const platform = detectPlatform();
  try {
    if (platform === "ios") {
      const mod: any = await import(/* @vite-ignore */ "capacitor-health");
      return mod?.CapacitorHealth ?? mod?.Health ?? mod?.default ?? null;
    }
    if (platform === "android") {
      const mod: any = await import(/* @vite-ignore */ "capacitor-health-connect");
      return mod?.HealthConnect ?? mod?.default ?? null;
    }
  } catch {
    // Plugin not installed in this build (e.g. PWA / preview) — fall back to no-op.
    return null;
  }
  return null;
}

const METRIC_KEYS: Record<WearableMetric, { ios: string; android: string }> = {
  sleep:      { ios: "sleepAnalysis",   android: "SleepSession" },
  resting_hr: { ios: "restingHeartRate", android: "RestingHeartRate" },
  hrv:        { ios: "heartRateVariability", android: "HeartRateVariabilityRmssd" },
  steps:      { ios: "steps",            android: "Steps" },
  workout:    { ios: "workout",          android: "ExerciseSession" },
};

/** Request permissions for the 5 MVP metrics. Returns granted scope list. */
export async function requestPermissions(): Promise<string[]> {
  const provider = wearableProviderForPlatform();
  if (!provider) throw new Error("Wearables require the iOS or Android app.");

  const plugin = await loadNativePlugin();
  if (!plugin) {
    // Plugin not bundled yet — record an "active" connection in dev so the UI
    // proceeds; native build will replace this with real auth.
    return ["sleep", "heart_rate", "hrv", "steps", "workouts"];
  }

  const platform = detectPlatform();
  const reads = (Object.keys(METRIC_KEYS) as WearableMetric[]).map(
    (m) => METRIC_KEYS[m][platform === "ios" ? "ios" : "android"],
  );
  try {
    if (typeof plugin.requestAuthorization === "function") {
      await plugin.requestAuthorization({ read: reads, write: [] });
    } else if (typeof plugin.requestPermissions === "function") {
      await plugin.requestPermissions({ permissions: reads });
    }
  } catch (e: any) {
    throw new Error(e?.message || "Permission request failed");
  }
  return reads;
}

async function readNativeSamples(sinceISO: string): Promise<WearableSample[]> {
  const plugin = await loadNativePlugin();
  if (!plugin) return [];
  const platform = detectPlatform();
  const out: WearableSample[] = [];

  for (const metric of Object.keys(METRIC_KEYS) as WearableMetric[]) {
    const dataType = METRIC_KEYS[metric][platform === "ios" ? "ios" : "android"];
    try {
      const fn = plugin.queryAggregated || plugin.query || plugin.read;
      if (!fn) continue;
      const res: any = await fn.call(plugin, {
        dataType,
        startDate: sinceISO,
        endDate: new Date().toISOString(),
      });
      const raws: RawNativeSample[] = Array.isArray(res) ? res : (res?.samples ?? res?.records ?? []);
      for (const r of raws) {
        out.push({
          metric_type: metric,
          value_numeric: typeof r.value === "number" ? r.value : null,
          unit: r.unit,
          start_at: r.startDate,
          end_at: r.endDate,
          source_device: r.sourceName,
          external_id: r.uuid,
          payload: r as Record<string, unknown>,
        });
      }
    } catch {
      // Skip metrics the user denied or that aren't supported on this device.
    }
  }
  return out;
}

/**
 * Pull samples since `sinceISO` from the native health store and POST them
 * to the ingest function. Returns number of samples uploaded.
 */
export async function syncSince(sinceISO: string, deviceLabel?: string): Promise<number> {
  const provider = wearableProviderForPlatform();
  if (!provider) return 0;

  const samples = await readNativeSamples(sinceISO);

  const { data, error } = await supabase.functions.invoke("ingest-wearable-samples", {
    body: { provider, device_label: deviceLabel, samples },
  });
  if (error || (data as any)?.error) {
    throw new Error((data as any)?.error || error?.message);
  }
  return (data as any)?.inserted ?? 0;
}

/** 14-day initial backfill. */
export async function initialBackfill(): Promise<number> {
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  return syncSince(since);
}

/** Fetch latest connection status row for the current user. */
export async function getStatus(): Promise<WearableStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { provider: null, connected: false, last_sync_at: null, device_label: null };

  const provider = wearableProviderForPlatform();
  const { data } = await supabase
    .from("wearable_connections")
    .select("provider,status,last_sync_at,device_label")
    .eq("user_id", user.id)
    .order("last_sync_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { provider, connected: false, last_sync_at: null, device_label: null };
  return {
    provider: data.provider as WearableProvider,
    connected: data.status === "active",
    last_sync_at: data.last_sync_at,
    device_label: data.device_label,
  };
}

export async function disconnect(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("wearable_connections")
    .update({ status: "revoked" })
    .eq("user_id", user.id);
}

/** Fetch yesterday's summary for the readiness prefill. */
export async function getYesterdaySummary() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("wearable_daily_summary")
    .select("sleep_minutes,resting_hr,hrv_rmssd,steps,baseline_hr_7d,baseline_hrv_7d")
    .eq("user_id", user.id)
    .eq("summary_date", yesterday)
    .maybeSingle();
  return data;
}

// ============================================================================
// Background pull on app open
// ----------------------------------------------------------------------------
// Rate-limited to once every 30 minutes to avoid hammering native APIs when
// the user toggles between apps. Uses last_sync_at when available.
// ============================================================================
const LAST_PULL_KEY = "wearable_last_pull_at";

export async function syncOnAppOpen(): Promise<number> {
  if (!isWearableSupported()) return 0;
  const status = await getStatus();
  if (!status.connected) return 0;

  const last = Number(localStorage.getItem(LAST_PULL_KEY) || 0);
  if (Date.now() - last < 30 * 60_000) return 0;

  const since = status.last_sync_at ?? new Date(Date.now() - 7 * 86400_000).toISOString();
  try {
    const inserted = await syncSince(since);
    localStorage.setItem(LAST_PULL_KEY, String(Date.now()));
    return inserted;
  } catch {
    return 0;
  }
}

// ============================================================================
// Workout auto-attach
// ----------------------------------------------------------------------------
// Find the most-overlapping wearable workout sample for a given logged_date
// and patch the workout_logs row with avg_hr / duration / calories so coaches
// see real intensity instead of a binary "completed" flag.
// ============================================================================
export interface AttachableMatch {
  duration_minutes: number;
  avg_hr: number | null;
  max_hr: number | null;
  calories: number | null;
  source: string | null;
}

export async function findWorkoutMatch(date: string): Promise<AttachableMatch | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;
  const { data } = await supabase
    .from("wearable_samples")
    .select("start_at,end_at,value_numeric,source_device,payload")
    .eq("user_id", user.id)
    .eq("metric_type", "workout")
    .gte("start_at", dayStart)
    .lte("start_at", dayEnd)
    .order("start_at", { ascending: true });
  if (!data || data.length === 0) return null;

  // Pick the longest workout that day as the "main" session.
  let best: any = null;
  let bestDur = 0;
  for (const w of data as any[]) {
    const start = new Date(w.start_at).getTime();
    const end = w.end_at ? new Date(w.end_at).getTime() : start;
    const mins = Math.max(0, Math.round((end - start) / 60000));
    if (mins > bestDur) { best = w; bestDur = mins; }
  }
  if (!best) return null;
  const p = best.payload || {};
  return {
    duration_minutes: bestDur,
    avg_hr: typeof p.avg_hr === "number" ? p.avg_hr : (typeof best.value_numeric === "number" ? Math.round(best.value_numeric) : null),
    max_hr: typeof p.max_hr === "number" ? p.max_hr : null,
    calories: typeof p.calories === "number" ? Math.round(p.calories) : null,
    source: best.source_device ?? null,
  };
}

/** Attach the wearable workout match to all workout_logs for the day if not already set. */
export async function autoAttachWorkoutLogs(date: string): Promise<number> {
  const match = await findWorkoutMatch(date);
  if (!match) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id, avg_hr")
    .eq("user_id", user.id)
    .eq("logged_date", date);
  if (!logs?.length) return 0;
  const ids = logs.filter((l: any) => l.avg_hr == null).map((l: any) => l.id);
  if (!ids.length) return 0;
  await supabase
    .from("workout_logs")
    .update({
      avg_hr: match.avg_hr,
      max_hr: match.max_hr,
      duration_minutes: match.duration_minutes,
      calories: match.calories,
      wearable_source: match.source,
    } as any)
    .in("id", ids);
  return ids.length;
}

// ============================================================================
// Coach: read athlete recovery trend (RPC, RLS-checked server-side)
// ============================================================================
export interface RecoveryTrendDay {
  summary_date: string;
  sleep_minutes: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  steps: number | null;
  baseline_hr_7d: number | null;
  baseline_hrv_7d: number | null;
}

export async function getAthleteRecoveryTrend(athleteId: string, days = 7): Promise<RecoveryTrendDay[]> {
  const { data, error } = await supabase.rpc("get_athlete_recovery_trend" as any, {
    _athlete_id: athleteId,
    _days: days,
  });
  if (error) return [];
  return (data ?? []) as RecoveryTrendDay[];
}
