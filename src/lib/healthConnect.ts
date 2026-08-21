// Health Connect bridge (Android-only). Safe no-op on web / iOS.
//
// V3 scope - MINIMUM SCOPE (Aug 2026). Reads TWO Health Connect record types:
// active energy and workouts. Maps them to the wearable_samples ingest shape
// and posts them to the SAME `wearable-ingest` edge function used by iOS, but
// with provider='health_connect' so the backend routes samples, workouts and
// the wearable_connections row to the Android provider slot.
//
// Sleep, heart rate and steps were REMOVED after Google Play enforcement on
// 20 Aug 2026 ("Overdreven dataadgang for den angivne funktion" - Health
// Connect permissions policy, Minimum Scope). Google did NOT object to
// EXERCISE or ACTIVE_CALORIES_BURNED. Resting HR and HRV had already been
// removed in an earlier round of the same policy.
//
// iOS HealthKit (src/lib/healthkit.ts) is UNAFFECTED and still reads sleep,
// resting HR, HRV, heart rate, active energy and workouts.
//
// Re-adding a type requires FOUR matching changes or it fails silently:
//   1. android/app/src/main/AndroidManifest.xml
//   2. recordClass() in SportstalentHealthConnect.kt
//   3. READ_TYPES below
//   4. Play Console -> Health apps declaration + Data safety
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
// MUST stay in sync with recordClass() in SportstalentHealthConnect.kt and
// with the uses-permission list in AndroidManifest.xml.
const READ_TYPES = ["active_energy", "workout"];

interface QuantitySample {
  uuid: string;
  external_id?: string;
  startDate: string;
  endDate: string;
  value: number;
  unit: string;
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
  // avgHr / maxHr are no longer populated on Android - heart-rate enrichment
  // was removed with the READ_HEART_RATE permission. Kept optional so the
  // shared payload shape still matches iOS.
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
    console.info("HC sync: requestAuthorization result", {
      granted: res?.granted,
      grantedPermissions: res?.grantedPermissions ?? [],
      requestedTypes: READ_TYPES,
    });
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
  metric_type: "active_energy" | "workout";
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

  let userId: string | undefined;
  try {
    const { data: userRes, error } = await supabase.auth.getUser();
    if (error) {
      console.error("HC sync: auth.getUser error", error);
      return { ok: false, reason: `auth_error:${error.message}` };
    }
    userId = userRes?.user?.id;
  } catch (e: any) {
    console.error("HC sync: auth.getUser threw", e);
    return { ok: false, reason: `auth_fetch_failed:${e?.message ?? e}` };
  }
  if (!userId) return { ok: false, reason: "no_user" };

  let conn: { last_sync_at: string | null } | null = null;
  try {
    const { data, error } = await supabase
      .from("wearable_connections")
      .select("last_sync_at")
      .eq("user_id", userId)
      .eq("provider", PROVIDER)
      .maybeSingle();
    if (error) {
      console.error("HC sync: wearable_connections select error", error);
      return { ok: false, reason: `conn_select_error:${error.message}` };
    }
    conn = data;
  } catch (e: any) {
    console.error("HC sync: wearable_connections select threw", e);
    return { ok: false, reason: `conn_fetch_failed:${e?.message ?? e}` };
  }

  const days = conn?.last_sync_at ? 30 : 90;
  const end = new Date();
  const start = new Date(Date.now() - days * 86400_000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  console.info("HC sync: window", { days, startIso, endIso, previousLastSync: conn?.last_sync_at ?? null });

  // Collect native rejects so we can surface them in the returned reason,
  // instead of silently swallowing them into empty arrays.
  const nativeErrors: string[] = [];

  const safeQty = async (id: string) => {
    try {
      const r = await HealthConnect.queryQuantity({
        metricType: id,
        startDate: startIso,
        endDate: endIso,
      });
      return r?.samples ?? [];
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.warn(`HealthConnect queryQuantity ${id} failed`, e);
      nativeErrors.push(`qty:${id}:${msg}`);
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
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.warn("HealthConnect queryWorkouts failed", e);
      nativeErrors.push(`workouts:${msg}`);
      return [];
    }
  };

  const [energy, workouts] = await Promise.all([
    safeQty("active_energy"),
    safeWorkouts(),
  ]);

  const perType = {
    active_energy: energy.length,
    workouts: workouts.length,
  };
  console.info("HC sync: per-type counts", perType, { nativeErrors });


  const samples: IngestSample[] = [];

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
    const countsStr = Object.entries(perType).map(([k, v]) => `${k}=${v}`).join(",");
    const errStr = nativeErrors.length > 0 ? `;errors=${nativeErrors.join("|")}` : "";
    console.info("HC sync: no samples to ingest", { perType, nativeErrors });
    return {
      ok: true,
      inserted: 0,
      workouts: 0,
      reason: `no_samples:${countsStr}${errStr}`,
    };
  }


  const CHUNK = 2000;
  let inserted = 0;
  let workoutsCount = 0;
  for (let i = 0; i < samples.length; i += CHUNK) {
    const chunk = samples.slice(i, i + CHUNK);
    try {
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
        return { ok: false, reason: `ingest_error:${error.message ?? "unknown"}` };
      }
      inserted += (data as any)?.inserted ?? 0;
      workoutsCount += (data as any)?.workouts_inserted ?? 0;
    } catch (e: any) {
      console.error("wearable-ingest threw (fetch failed)", e);
      return { ok: false, reason: `ingest_fetch_failed:${e?.message ?? e}` };
    }
  }

  await Preferences.set({ key: THROTTLE_KEY, value: String(Date.now()) });
  return { ok: true, inserted, workouts: workoutsCount };
}
