// HealthKit bridge (iOS-only). Safe no-op on web / Android.
//
// V1 scope — pure observations. Reads 6 HealthKit types (sleep, restingHR,
// HRV, heart rate, active energy, workouts) for the last 30 days (90 days on
// first sync), maps them to the wearable_samples ingest shape, and posts them
// to the `wearable-ingest` edge function. That edge function upserts samples
// idempotently and calls the existing `recompute_wearable_summary` DB
// function, which drives the existing Health.tsx / RecoveryTile UI.
//
// No score, no recommendation, no color coding — those live elsewhere (or
// not at all for HealthKit V1).

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { supabase } from "@/integrations/supabase/client";

const THROTTLE_KEY = "healthkit_last_sync_at";
const THROTTLE_MS = 60 * 60 * 1000; // 1 hour

const READ_TYPES = [
  "sleepAnalysis",
  "restingHeartRate",
  "heartRateVariabilitySDNN",
  "heartRate",
  "activeEnergyBurned",
  "workoutType",
];

export function isHealthKitAvailable(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

async function getPlugin() {
  if (!isHealthKitAvailable()) return null;
  try {
    const mod: any = await import("@perfood/capacitor-healthkit");
    return mod.CapacitorHealthkit ?? mod.default ?? null;
  } catch (e) {
    console.warn("HealthKit plugin not available", e);
    return null;
  }
}

export async function requestHealthKitPermission(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    await plugin.requestAuthorization({
      all: [],
      read: READ_TYPES,
      write: [],
    });
    return true;
  } catch (e) {
    console.warn("HealthKit authorization failed", e);
    return false;
  }
}

type IngestSample = {
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

function iso(v: any): string | null {
  if (!v) return null;
  try {
    return new Date(v).toISOString();
  } catch {
    return null;
  }
}

async function queryOne(
  plugin: any,
  sampleName: string,
  startDate: string,
  endDate: string,
): Promise<any[]> {
  try {
    const res = await plugin.queryHKitSampleType({
      sampleName,
      startDate,
      endDate,
      limit: 0,
    });
    return res?.resultData ?? [];
  } catch (e) {
    console.warn(`HealthKit query failed for ${sampleName}`, e);
    return [];
  }
}

export async function syncHealthKit(
  opts: { force?: boolean } = {},
): Promise<{ ok: boolean; inserted?: number; workouts?: number; reason?: string }> {
  const plugin = await getPlugin();
  if (!plugin) return { ok: false, reason: "unavailable" };

  if (!opts.force) {
    const last = await Preferences.get({ key: THROTTLE_KEY }).catch(() => ({
      value: null,
    }));
    const lastMs = last.value ? Number(last.value) : 0;
    if (lastMs && Date.now() - lastMs < THROTTLE_MS) {
      return { ok: false, reason: "throttled" };
    }
  }

  // Determine window. First sync = 90 days, subsequent = 30 days.
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

  const [sleep, rhr, hrv, hr, energy, workouts] = await Promise.all([
    queryOne(plugin, "sleepAnalysis", startIso, endIso),
    queryOne(plugin, "restingHeartRate", startIso, endIso),
    queryOne(plugin, "heartRateVariabilitySDNN", startIso, endIso),
    queryOne(plugin, "heartRate", startIso, endIso),
    queryOne(plugin, "activeEnergyBurned", startIso, endIso),
    queryOne(plugin, "workoutType", startIso, endIso),
  ]);

  const samples: IngestSample[] = [];

  // Sleep — sum minutes of asleep periods. The plugin returns individual
  // stage/state rows; we forward each row and let downstream aggregate.
  for (const s of sleep) {
    const startAt = iso(s.startDate);
    const endAt = iso(s.endDate);
    if (!startAt) continue;
    const durMin =
      typeof s.duration === "number"
        ? s.duration / 60
        : endAt
          ? (Date.parse(endAt) - Date.parse(startAt)) / 60000
          : null;
    // Only forward "asleep" state (value 1 in HK). Fall back to include-all if
    // the plugin doesn't expose value.
    const val = s.value ?? s.sleepState ?? null;
    const isAsleep = val === null || val === 1 || val === "asleep" || val === "inBed";
    if (!isAsleep) continue;
    samples.push({
      metric_type: "sleep",
      value_numeric: durMin,
      unit: "min",
      start_at: startAt,
      end_at: endAt,
      external_id: s.uuid ?? null,
      source_device: s.sourceName ?? null,
      payload: { raw_value: val },
    });
  }

  for (const s of rhr) {
    const startAt = iso(s.startDate);
    if (!startAt) continue;
    samples.push({
      metric_type: "resting_hr",
      value_numeric: typeof s.value === "number" ? s.value : null,
      unit: "bpm",
      start_at: startAt,
      end_at: iso(s.endDate),
      external_id: s.uuid ?? null,
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of hrv) {
    const startAt = iso(s.startDate);
    if (!startAt) continue;
    samples.push({
      metric_type: "hrv",
      value_numeric: typeof s.value === "number" ? s.value : null,
      unit: "ms",
      start_at: startAt,
      end_at: iso(s.endDate),
      external_id: s.uuid ?? null,
      source_device: s.sourceName ?? null,
    });
  }

  // Heart rate + active energy — forwarded but only used via workouts in UI.
  for (const s of hr) {
    const startAt = iso(s.startDate);
    if (!startAt) continue;
    samples.push({
      metric_type: "heart_rate",
      value_numeric: typeof s.value === "number" ? s.value : null,
      unit: "bpm",
      start_at: startAt,
      end_at: iso(s.endDate),
      external_id: s.uuid ?? null,
      source_device: s.sourceName ?? null,
    });
  }

  for (const s of energy) {
    const startAt = iso(s.startDate);
    if (!startAt) continue;
    samples.push({
      metric_type: "active_energy",
      value_numeric: typeof s.value === "number" ? s.value : null,
      unit: "kcal",
      start_at: startAt,
      end_at: iso(s.endDate),
      external_id: s.uuid ?? null,
      source_device: s.sourceName ?? null,
    });
  }

  for (const w of workouts) {
    const startAt = iso(w.startDate);
    if (!startAt) continue;
    const endAt = iso(w.endDate);
    const durationMin =
      typeof w.duration === "number"
        ? w.duration / 60
        : endAt
          ? (Date.parse(endAt) - Date.parse(startAt)) / 60000
          : null;
    samples.push({
      metric_type: "workout",
      value_numeric: typeof w.totalEnergyBurned === "number" ? w.totalEnergyBurned : null,
      unit: "kcal",
      start_at: startAt,
      end_at: endAt,
      external_id: w.uuid ?? null,
      source_device: w.sourceName ?? null,
      payload: {
        activity_label: w.workoutActivityName ?? w.workoutActivityId ?? null,
        avg_hr: w.averageHeartRate ?? null,
        max_hr: w.maxHeartRate ?? null,
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

  // Chunk to <= 2000 per request to stay comfortably under the 5000 cap.
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
