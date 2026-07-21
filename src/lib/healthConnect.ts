// Health Connect bridge (Android-only). Safe no-op on web / iOS.
//
// V2 scope — pure observations, mirrors src/lib/healthkit.ts. Reads 7 Health
// Connect record types (sleep, resting HR, HRV, heart rate, active energy,
// steps, workouts) for the last 30 days (90 days on first sync), maps them
// to the wearable_samples ingest shape, and posts them to the SAME
// `wearable-ingest` edge function used by iOS — but with
// provider='health_connect' so the backend routes samples, workouts, and the
// wearable_connections row to the Android provider slot.
//
// The native side is a local Capacitor 8 App-target Kotlin plugin
// (`android/app/src/main/java/dk/sportstalent/app/SportstalentHealthConnect.kt`).
// MainActivity explicitly registers it in the native Capacitor registry
// before bridge init.

import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/integrations/supabase/client";

const THROTTLE_KEY = "healthconnect_last_sync_at";
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
const HEALTH_CONNECT_PLUGIN_NAME = "SportstalentHealthConnect";
const PROVIDER = "health_connect";

// Short metric ids that the Kotlin plugin maps to Health Connect record
// classes. Kept identical to the wearable_samples.metric_type domain so we
// don't need to remap on the way out.
const READ_TYPES = [
  "sleep",
  "resting_hr",
  "hrv",
  "heart_rate",
  "active_energy",
  "steps",
  "workout",
];

interface QuantitySample {
  uuid: string;
  external_id?: string;
  startDate: string;
  endDate: string;
  value: number;
  unit: string;
  sourceName?: string;
}
interface CategorySample {
  // Sleep sessions from Health Connect. `value` = duration in SECONDS as
  // emitted by the Kotlin plugin; we convert to minutes below.
  uuid: string;
  external_id?: string;
  startDate: string;
  endDate: string;
  value: number;
  unit?: string;
  sourceName?: string;
}
interface WorkoutSample {
  uuid: string;
  external_id?: string;
  startDate: string;
  endDate: string;
  duration: number; // seconds
  activityType: number | string;
  title?: string;
  avgHr?: number | null;
  maxHr?: number | null;
  calories?: number | null;
  sourceName?: string;
}

interface SportstalentHealthConnectPlugin {
  debugRegistration(): Promise<{
    registered: boolean;
    sdkStatus: number | string;
    healthConnectAvailable: boolean;
    identifier: string;
    jsName: string;
    methods: string[];
  }>;
  isAvailable(): Promise<{ available: boolean; sdkStatus: number | string }>;
  requestAuthorization(opts: { read: string[] }): Promise<{
    granted: boolean;
    grantedPermissions?: string[];
  }>;
  queryQuantity(opts: {
    metricType: string;
    startDate: string;
    endDate: string;
  }): Promise<{ samples: QuantitySample[] }>;
  queryCategory(opts: {
    metricType: string;
    startDate: string;
    endDate: string;
  }): Promise<{ samples: CategorySample[] }>;
  queryWorkouts(opts: {
    startDate: string;
    endDate: string;
  }): Promise<{ workouts: WorkoutSample[] }>;
}

const HealthConnect = registerPlugin<SportstalentHealthConnectPlugin>(
  HEALTH_CONNECT_PLUGIN_NAME,
);

function isHealthConnectPluginRegistered(): boolean {
  try {
    const headers = (globalThis as any).Capacitor?.PluginHeaders;
    if (Array.isArray(headers)) {
      return headers.some(
        (header) => header?.name === HEALTH_CONNECT_PLUGIN_NAME,
      );
    }
    return false;
  } catch {
    return false;
  }
}

function logHealthConnectBridgeStatus(context: string) {
  try {
    console.info("HealthConnect bridge status", {
      context,
      platform: Capacitor.getPlatform(),
      native: Capacitor.isNativePlatform(),
      plugin: HEALTH_CONNECT_PLUGIN_NAME,
      available: Capacitor.isPluginAvailable(HEALTH_CONNECT_PLUGIN_NAME),
      nativeHeaderRegistered: isHealthConnectPluginRegistered(),
    });
  } catch (e) {
    console.warn("HealthConnect bridge status check failed", e);
  }
}

export function isHealthConnectAvailable(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export async function requestHealthConnectPermission(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!isHealthConnectAvailable()) return { ok: false, reason: "not_android" };

  logHealthConnectBridgeStatus("requestHealthConnectPermission");

  if (!isHealthConnectPluginRegistered()) {
    return { ok: false, reason: "plugin_not_registered" };
  }

  try {
    const debug = await HealthConnect.debugRegistration();
    console.info("HealthConnect native registration", debug);

    const res = await HealthConnect.requestAuthorization({ read: READ_TYPES });
    return {
      ok: !!res?.granted,
      reason: res?.granted ? undefined : "not_granted",
    };
  } catch (e: any) {
    console.warn("HealthConnect authorization failed", e);
    return { ok: false, reason: `auth_threw:${e?.message ?? e}` };
  }
}

type IngestSample = {
  metric_type:
    | "sleep"
    | "resting_hr"
    | "hrv"
    | "heart_rate"
    | "active_energy"
    | "steps"
    | "workout";
  value_numeric?: number | null;
  unit?: string | null;
  start_at: string;
  end_at?: string | null;
  source_device?: string | null;
  external_id?: string | null;
  payload?: Record<string, unknown> | null;
};

function extId(s: { external_id?: string; uuid?: string }): string | null {
  return s.external_id ?? s.uuid ?? null;
}

export async function syncHealthConnect(
  opts: { force?: boolean } = {},
): Promise<{ ok: boolean; inserted?: number; workouts?: number; reason?: string }> {
  if (!isHealthConnectAvailable()) return { ok: false, reason: "not_android" };

  logHealthConnectBridgeStatus("syncHealthConnect");

  if (!isHealthConnectPluginRegistered()) {
    return { ok: false, reason: "plugin_not_registered" };
  }

  // Verify the native SDK is actually usable on this device.
  try {
    const avail = await HealthConnect.isAvailable();
    if (!avail?.available) return { ok: false, reason: "hc_unavailable" };
  } catch (e: any) {
    return { ok: false, reason: `no_native_bridge:${e?.message ?? e}` };
  }

  if (!opts.force) {
    const last = await Preferences.get({ key: THROTTLE_KEY }).catch(() => ({
      value: null,
    }));
    const lastMs = last.value ? Number(last.value) : 0;
    if (lastMs && Date.now() - lastMs < THROTTLE_MS) {
      return { ok: false, reason: "throttled" };
    }
  }

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) return { ok: false, reason: "no_user" };

  const { data: conn } = await supabase
    .from("wearable_connections")
    .select("last_sync_at")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  const days = conn?.last_sync_at ? 30 : 90;
  const end = new Date();
  const start = new Date(Date.now() - days * 86400_000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const safeQty = async (id: string) => {
    try {
      const r = await HealthConnect.queryQuantity({
        metricType: id,
        startDate: startIso,
        endDate: endIso,
      });
      return r?.samples ?? [];
    } catch (e) {
      console.warn(`HealthConnect queryQuantity ${id} failed`, e);
      return [];
    }
  };
  const safeCat = async (id: string) => {
    try {
      const r = await HealthConnect.queryCategory({
        metricType: id,
        startDate: startIso,
        endDate: endIso,
      });
      return r?.samples ?? [];
    } catch (e) {
      console.warn(`HealthConnect queryCategory ${id} failed`, e);
      return [];
    }
  };
  const safeWorkouts = async () => {
    try {
      const r = await HealthConnect.queryWorkouts({
        startDate: startIso,
        endDate: endIso,
      });
      return r?.workouts ?? [];
    } catch (e) {
      console.warn("HealthConnect queryWorkouts failed", e);
      return [];
    }
  };

  const [sleep, rhr, hrv, hr, energy, steps, workouts] = await Promise.all([
    safeCat("sleep"),
    safeQty("resting_hr"),
    safeQty("hrv"),
    safeQty("heart_rate"),
    safeQty("active_energy"),
    safeQty("steps"),
    safeWorkouts(),
  ]);

  const samples: IngestSample[] = [];

  // Sleep — Health Connect delivers one session per record with the total
  // duration in seconds. No stage filtering needed (unlike HealthKit).
  // Convert seconds → minutes so it matches what wearable-ingest /
  // recompute_wearable_summary expect (sleep_minutes).
  for (const s of sleep) {
    const durMin = Number.isFinite(s.value) ? s.value / 60 : null;
    if (durMin === null) continue;
    samples.push({
      metric_type: "sleep",
      value_numeric: durMin,
      unit: "min",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: extId(s),
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of rhr) {
    samples.push({
      metric_type: "resting_hr",
      value_numeric: s.value,
      unit: "bpm",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: extId(s),
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of hrv) {
    samples.push({
      metric_type: "hrv",
      value_numeric: s.value,
      unit: "ms",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: extId(s),
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of hr) {
    samples.push({
      metric_type: "heart_rate",
      value_numeric: s.value,
      unit: "bpm",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: extId(s),
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of energy) {
    samples.push({
      metric_type: "active_energy",
      value_numeric: s.value,
      unit: "kcal",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: extId(s),
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of steps) {
    samples.push({
      metric_type: "steps",
      value_numeric: s.value,
      unit: "count",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: extId(s),
      source_device: s.sourceName ?? null,
    });
  }

  for (const w of workouts) {
    const durationMin =
      typeof w.duration === "number" && w.duration > 0 ? w.duration / 60 : null;
    samples.push({
      metric_type: "workout",
      value_numeric: w.calories ?? null,
      unit: "kcal",
      start_at: w.startDate,
      end_at: w.endDate,
      external_id: extId(w),
      source_device: w.sourceName ?? null,
      payload: {
        activity_label: w.title ?? null,
        activity_type: w.activityType,
        duration_minutes: durationMin,
        calories: w.calories ?? null,
        avg_hr: w.avgHr ?? null,
        max_hr: w.maxHr ?? null,
      },
    });
  }

  if (samples.length === 0) {
    await Preferences.set({ key: THROTTLE_KEY, value: String(Date.now()) });
    return { ok: true, inserted: 0, workouts: 0 };
  }

  const CHUNK = 2000;
  let inserted = 0;
  let workoutsCount = 0;
  for (let i = 0; i < samples.length; i += CHUNK) {
    const chunk = samples.slice(i, i + CHUNK);
    const { data, error } = await supabase.functions.invoke("wearable-ingest", {
      body: {
        samples: chunk,
        device_label: "Android",
        granted_scopes: READ_TYPES,
        provider: PROVIDER,
      },
    });
    if (error) {
      console.error("wearable-ingest failed", error);
      return { ok: false, reason: "ingest_error" };
    }
    inserted += (data as any)?.inserted ?? 0;
    workoutsCount += (data as any)?.workouts_inserted ?? 0;
  }

  await Preferences.set({ key: THROTTLE_KEY, value: String(Date.now()) });
  return { ok: true, inserted, workouts: workoutsCount };
}
