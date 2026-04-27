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
  // Capacitor exposes window.Capacitor when running natively
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

/** Request permissions for the 5 MVP metrics. Returns granted scope list. */
export async function requestPermissions(): Promise<string[]> {
  const provider = wearableProviderForPlatform();
  if (!provider) throw new Error("Wearables require the iOS or Android app.");
  // Native plugin call goes here — placeholder so the wrapper compiles in web.
  // The actual Capacitor plugin is wired in a follow-up native build step.
  const scopes = ["sleep", "heart_rate", "hrv", "steps", "workouts"];
  return scopes;
}

/**
 * Pull samples since `sinceISO` from the native health store and POST them
 * to the ingest function. Returns number of samples uploaded.
 *
 * Native bridges populate `samples`; on web/preview we just no-op so the rest
 * of the UI works in development.
 */
export async function syncSince(sinceISO: string, deviceLabel?: string): Promise<number> {
  const provider = wearableProviderForPlatform();
  if (!provider) return 0;

  // === Native bridge integration point ===
  // const samples = await NativeHealth.read({ since: sinceISO, metrics: [...] });
  const samples: WearableSample[] = [];

  const { data, error } = await supabase.functions.invoke("ingest-wearable-samples", {
    body: {
      provider,
      device_label: deviceLabel,
      samples,
    },
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
