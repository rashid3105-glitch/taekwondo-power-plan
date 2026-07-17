// HealthKit bridge (iOS-only). Safe no-op on web / Android.
//
// V1 scope — pure observations. Reads 6 HealthKit types (sleep, restingHR,
// HRV, heart rate, active energy, workouts) for the last 30 days (90 days on
// first sync), maps them to the wearable_samples ingest shape, and posts them
// to the `wearable-ingest` edge function. That edge function upserts samples
// idempotently and calls the existing `recompute_wearable_summary` DB
// function, which drives the existing Health.tsx / RecoveryTile UI.
//
// The native side is a local Capacitor 8 App-target plugin
// (`ios/App/App/SportstalentHealthKit.swift`). MainViewController explicitly
// registers it in the native Capacitor registry during capacitorDidLoad().

import { Capacitor, registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/integrations/supabase/client";

const THROTTLE_KEY = "healthkit_last_sync_at";
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes
const HEALTHKIT_PLUGIN_NAME = "SportstalentHealthKit";

// Native identifiers whitelisted on the Swift side.
const READ_TYPES = [
  "sleepAnalysis",
  "restingHeartRate",
  "heartRateVariabilitySDNN",
  "heartRate",
  "activeEnergyBurned",
  "stepCount",
  "workoutType",
];

interface QuantitySample {
  uuid: string;
  startDate: string;
  endDate: string;
  value: number;
  unit: string;
  sourceName?: string;
}
interface CategorySample {
  uuid: string;
  startDate: string;
  endDate: string;
  value: number;
  sourceName?: string;
}
interface WorkoutSample {
  uuid: string;
  startDate: string;
  endDate: string;
  duration: number; // seconds
  activityType: number;
  activityName: string;
  sourceName?: string;
  totalEnergyBurned?: number;
  totalDistance?: number;
}

interface SportstalentHealthKitPlugin {
  debugRegistration(): Promise<{
    loaded: boolean;
    identifier: string;
    jsName: string;
    methods: string[];
    healthDataAvailable: boolean;
  }>;
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(opts: { read: string[] }): Promise<{ granted: boolean }>;
  queryQuantity(opts: {
    sampleType: string;
    startDate: string;
    endDate: string;
  }): Promise<{ samples: QuantitySample[] }>;
  queryCategory(opts: {
    sampleType: string;
    startDate: string;
    endDate: string;
  }): Promise<{ samples: CategorySample[] }>;
  queryWorkouts(opts: {
    startDate: string;
    endDate: string;
  }): Promise<{ workouts: WorkoutSample[] }>;
}

const HealthKit = registerPlugin<SportstalentHealthKitPlugin>(
  HEALTHKIT_PLUGIN_NAME,
);

function isHealthKitPluginRegistered(): boolean {
  try {
    const headers = (globalThis as any).Capacitor?.PluginHeaders;
    if (Array.isArray(headers)) {
      return headers.some((header) => header?.name === HEALTHKIT_PLUGIN_NAME);
    }

    return false;
  } catch {
    return false;
  }
}

function logHealthKitBridgeStatus(context: string) {
  try {
    console.info("HealthKit bridge status", {
      context,
      platform: Capacitor.getPlatform(),
      native: Capacitor.isNativePlatform(),
      plugin: HEALTHKIT_PLUGIN_NAME,
      available: Capacitor.isPluginAvailable(HEALTHKIT_PLUGIN_NAME),
      nativeHeaderRegistered: isHealthKitPluginRegistered(),
    });
  } catch (e) {
    console.warn("HealthKit bridge status check failed", e);
  }
}

export function isHealthKitAvailable(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

export async function requestHealthKitPermission(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!isHealthKitAvailable()) return { ok: false, reason: "not_ios" };

  logHealthKitBridgeStatus("requestHealthKitPermission");

  if (!isHealthKitPluginRegistered()) {
    return { ok: false, reason: "plugin_not_registered" };
  }

  try {
    const debug = await HealthKit.debugRegistration();
    console.info("HealthKit native registration", debug);

    const res = await HealthKit.requestAuthorization({ read: READ_TYPES });
    return { ok: !!res?.granted, reason: res?.granted ? undefined : "not_granted" };
  } catch (e: any) {
    console.warn("HealthKit authorization failed", e);
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

export async function syncHealthKit(
  opts: { force?: boolean } = {},
): Promise<{ ok: boolean; inserted?: number; workouts?: number; reason?: string }> {
  if (!isHealthKitAvailable()) return { ok: false, reason: "not_ios" };

  logHealthKitBridgeStatus("syncHealthKit");

  if (!isHealthKitPluginRegistered()) {
    return { ok: false, reason: "plugin_not_registered" };
  }

  // Verify the native class is actually in the binary.
  try {
    const avail = await HealthKit.isAvailable();
    if (!avail?.available) return { ok: false, reason: "hk_unavailable" };
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
    .eq("provider", "apple_health")
    .maybeSingle();

  const days = conn?.last_sync_at ? 30 : 90;
  const end = new Date();
  const start = new Date(Date.now() - days * 86400_000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const safeQty = async (id: string) => {
    try {
      const r = await HealthKit.queryQuantity({
        sampleType: id,
        startDate: startIso,
        endDate: endIso,
      });
      return r?.samples ?? [];
    } catch (e) {
      console.warn(`HealthKit queryQuantity ${id} failed`, e);
      return [];
    }
  };
  const safeCat = async (id: string) => {
    try {
      const r = await HealthKit.queryCategory({
        sampleType: id,
        startDate: startIso,
        endDate: endIso,
      });
      return r?.samples ?? [];
    } catch (e) {
      console.warn(`HealthKit queryCategory ${id} failed`, e);
      return [];
    }
  };
  const safeWorkouts = async () => {
    try {
      const r = await HealthKit.queryWorkouts({ startDate: startIso, endDate: endIso });
      return r?.workouts ?? [];
    } catch (e) {
      console.warn("HealthKit queryWorkouts failed", e);
      return [];
    }
  };

  const [sleep, rhr, hrv, hr, energy, steps, workouts] = await Promise.all([
    safeCat("sleepAnalysis"),
    safeQty("restingHeartRate"),
    safeQty("heartRateVariabilitySDNN"),
    safeQty("heartRate"),
    safeQty("activeEnergyBurned"),
    safeQty("stepCount"),
    safeWorkouts(),
  ]);

  const samples: IngestSample[] = [];

  // Sleep — HKCategoryValueSleepAnalysis: 0=inBed, 1=asleepUnspecified,
  // 2=awake, 3=asleepCore, 4=asleepDeep, 5=asleepREM. Forward all "asleep"
  // stages (1, 3, 4, 5). Skip inBed (0) and awake (2).
  for (const s of sleep) {
    const isAsleep = [1, 3, 4, 5].includes(s.value);
    if (!isAsleep) continue;
    const durMin = (Date.parse(s.endDate) - Date.parse(s.startDate)) / 60000;
    samples.push({
      metric_type: "sleep",
      value_numeric: durMin,
      unit: "min",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: s.uuid,
      source_device: s.sourceName ?? null,
      payload: { hk_sleep_value: s.value },
    });
  }

  for (const s of rhr) {
    samples.push({
      metric_type: "resting_hr",
      value_numeric: s.value,
      unit: "bpm",
      start_at: s.startDate,
      end_at: s.endDate,
      external_id: s.uuid,
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
      external_id: s.uuid,
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
      external_id: s.uuid,
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
      external_id: s.uuid,
      source_device: s.sourceName ?? null,
    });
  }

  for (const w of workouts) {
    const durationMin = w.duration ? w.duration / 60 : null;
    samples.push({
      metric_type: "workout",
      value_numeric: w.totalEnergyBurned ?? null,
      unit: "kcal",
      start_at: w.startDate,
      end_at: w.endDate,
      external_id: w.uuid,
      source_device: w.sourceName ?? null,
      payload: {
        activity_label: w.activityName,
        activity_type: w.activityType,
        duration_minutes: durationMin,
        calories: w.totalEnergyBurned ?? null,
        distance: w.totalDistance ?? null,
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
        device_label: "iPhone",
        granted_scopes: READ_TYPES,
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
