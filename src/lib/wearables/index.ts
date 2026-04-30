// Native HealthKit / Health Connect bridge built on the `capacitor-health`
// plugin. Web users get a stub that reports "unsupported".
//
// We ingest: Steps (aggregated daily), Workouts (with HR series, calories,
// distance), Sleep, Resting Heart Rate and Heart-Rate Variability. The latter
// three are pulled via `Health.readSamples` which works on both iOS HealthKit
// and Android Health Connect.

import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

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
  last_attempt_at: string | null;
  device_label: string | null;
}

export type MetricBreakdown = Record<WearableMetric, number>;
const EMPTY_BREAKDOWN: MetricBreakdown = {
  sleep: 0, resting_hr: 0, hrv: 0, steps: 0, workout: 0,
};

export interface PlatformSignals {
  capacitorPlatform: string;        // raw value from Capacitor.getPlatform()
  capacitorIsNative: boolean;       // Capacitor.isNativePlatform()
  windowCapacitorPlatform: string;  // (window as any).Capacitor?.getPlatform?.()
  hasWebkitBridge: boolean;         // iOS WKWebView marker
  userAgentHint: boolean;           // CapacitorWebView in UA
  schemeHint: boolean;              // location starts with capacitor:// / ionic://
  serverUrl: string | null;         // capacitor.config server.url if hot-reloaded
  userAgent: string;
  href: string;
}

export function getPlatformSignals(): PlatformSignals {
  let capacitorPlatform = "";
  let capacitorIsNative = false;
  try {
    capacitorPlatform = Capacitor?.getPlatform?.() ?? "";
    capacitorIsNative = !!Capacitor?.isNativePlatform?.();
  } catch { /* ignore */ }

  const win: any = typeof window !== "undefined" ? window : undefined;
  const winCap: any = win?.Capacitor;
  const windowCapacitorPlatform = (() => {
    try { return winCap?.getPlatform?.() ?? ""; } catch { return ""; }
  })();

  const hasWebkitBridge = !!win?.webkit?.messageHandlers;
  const userAgent = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const userAgentHint = /CapacitorWebView/i.test(userAgent);
  const href = (typeof location !== "undefined" && location.href) || "";
  const schemeHint = /^(capacitor|ionic):\/\//i.test(href);
  const serverUrl: string | null = (() => {
    try {
      const v = winCap?.serverUrl ?? winCap?.config?.server?.url ?? null;
      return typeof v === "string" && v.length ? v : null;
    } catch { return null; }
  })();

  return {
    capacitorPlatform,
    capacitorIsNative,
    windowCapacitorPlatform,
    hasWebkitBridge,
    userAgentHint,
    schemeHint,
    serverUrl,
    userAgent: userAgent.slice(0, 200),
    href: href.slice(0, 200),
  };
}

function detectPlatform(): "ios" | "android" | "web" {
  // Hardened detection — we accept any of several independent signals,
  // because a single failing bridge check has shipped false-negatives in
  // production (WebView shadows globals, plugins inject late, etc.).
  const s = getPlatformSignals();

  const candidates = [s.capacitorPlatform, s.windowCapacitorPlatform];
  for (const c of candidates) {
    if (c === "ios" || c === "android") return c;
  }
  if (s.capacitorIsNative) {
    // isNativePlatform true but getPlatform empty — guess from UA / scheme.
    if (/iPhone|iPad|iPod/i.test(s.userAgent)) return "ios";
    if (/Android/i.test(s.userAgent)) return "android";
  }
  if (s.hasWebkitBridge && /iPhone|iPad|iPod/i.test(s.userAgent)) return "ios";
  if (s.schemeHint) {
    if (/iPhone|iPad|iPod/i.test(s.userAgent)) return "ios";
    if (/Android/i.test(s.userAgent)) return "android";
  }
  if (s.userAgentHint) {
    if (/iPhone|iPad|iPod/i.test(s.userAgent)) return "ios";
    if (/Android/i.test(s.userAgent)) return "android";
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
// capacitor-health bridge
// ============================================================================
// IMPORTANT (iOS): HealthKit's permission sheet is only shown when
// `requestHealthPermissions` is called *synchronously* inside a user gesture.
// Any `await` between the button tap and that call causes iOS to silently
// deny the prompt. We therefore eagerly preload the plugin module on screen
// mount via `preloadHealthPlugin()` and cache it, so the click handler can
// call it with zero awaits in front.

let _HealthCache: any | null = null;
let _HealthLoadPromise: Promise<any | null> | null = null;

async function loadHealth(): Promise<any | null> {
  if (_HealthCache) return _HealthCache;
  if (detectPlatform() === "web") return null;
  if (_HealthLoadPromise) return _HealthLoadPromise;
  _HealthLoadPromise = (async () => {
    try {
      const mod: any = await import(/* @vite-ignore */ "capacitor-health");
      _HealthCache = mod?.Health ?? null;
      return _HealthCache;
    } catch (e) {
      console.warn("[wearables] capacitor-health import failed", e);
      return null;
    }
  })();
  return _HealthLoadPromise;
}

/** Call from screen mount so the plugin is hot when the user taps Connect. */
export async function preloadHealthPlugin(): Promise<void> {
  await loadHealth();
}

/** Synchronous accessor for the click handler (returns null if not preloaded). */
export function getHealthSync(): any | null {
  return _HealthCache;
}

const PERMISSIONS = [
  "READ_STEPS",
  "READ_HEART_RATE",
  "READ_WORKOUTS",
  "READ_ACTIVE_CALORIES",
  "READ_TOTAL_CALORIES",
  "READ_DISTANCE",
  "READ_SLEEP",
  "READ_RESTING_HEART_RATE",
  "READ_HEART_RATE_VARIABILITY",
] as const;

export interface WearableDiagnostics {
  inNativeApp: boolean;
  provider: WearableProvider | null;
  pluginLoaded: boolean;
  healthAvailable: boolean | null; // null = unknown / not checked
  availabilityError: string | null;
}

/** Run on screen mount. Safe to call from a non-gesture context. */
export async function getDiagnostics(): Promise<WearableDiagnostics> {
  const provider = wearableProviderForPlatform();
  const inNativeApp = provider !== null;
  const Health = await loadHealth();
  let healthAvailable: boolean | null = null;
  let availabilityError: string | null = null;
  if (Health?.isHealthAvailable) {
    try {
      const r = await Health.isHealthAvailable();
      healthAvailable = r?.available !== false;
    } catch (e: any) {
      availabilityError = e?.message || String(e);
    }
  }
  return {
    inNativeApp,
    provider,
    pluginLoaded: !!Health,
    healthAvailable,
    availabilityError,
  };
}

const LAST_GRANT_KEY = "wearable_last_grant";

export interface PermissionGrantRecord {
  at: number;
  raw: unknown;
  error: string | null;
}

export function getLastPermissionGrant(): PermissionGrantRecord | null {
  try {
    const raw = localStorage.getItem(LAST_GRANT_KEY);
    return raw ? (JSON.parse(raw) as PermissionGrantRecord) : null;
  } catch { return null; }
}

function recordPermissionGrant(rec: PermissionGrantRecord) {
  try { localStorage.setItem(LAST_GRANT_KEY, JSON.stringify(rec)); } catch {}
}

/**
 * Request permissions. MUST be called synchronously inside a user gesture
 * on iOS — see the note above. The caller should have invoked
 * `preloadHealthPlugin()` on screen mount; if not, we fall back to the
 * async loader (which works on Android but may be silently denied on iOS).
 */
export async function requestPermissions(): Promise<string[]> {
  const provider = wearableProviderForPlatform();
  if (!provider) throw new Error("Wearables require the iOS or Android app.");

  const Health = _HealthCache ?? (await loadHealth());
  if (!Health) {
    console.warn("[wearables] capacitor-health not available; using stub.");
    recordPermissionGrant({ at: Date.now(), raw: null, error: "plugin not loaded" });
    return [...PERMISSIONS];
  }

  try {
    // NOTE: do NOT call isHealthAvailable() here — it adds an await and
    // breaks the iOS user-gesture chain. Availability is checked separately
    // in getDiagnostics() at screen mount.
    const result = await Health.requestHealthPermissions({ permissions: [...PERMISSIONS] });
    recordPermissionGrant({ at: Date.now(), raw: result ?? null, error: null });
  } catch (e: any) {
    const msg = e?.message || "Permission request failed";
    recordPermissionGrant({ at: Date.now(), raw: null, error: msg });
    throw new Error(msg);
  }
  return [...PERMISSIONS];
}

/** Wipe the local connection so the next Connect tap is a clean start. */
export async function resetConnection(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("wearable_connections")
    .delete()
    .eq("user_id", user.id);
  try {
    localStorage.removeItem(LAST_PULL_KEY);
    localStorage.removeItem(SYNC_STATS_KEY);
    localStorage.removeItem(LAST_GRANT_KEY);
  } catch {}
}

interface RawWorkout {
  startDate: string;
  endDate: string;
  workoutType?: string;
  sourceName?: string;
  id?: string;
  duration?: number;
  distance?: number;
  steps?: number;
  calories?: number;
  sourceBundleId?: string;
  heartRate?: { timestamp: string; bpm: number }[];
}

interface AggregatedBucket {
  startDate: string;
  endDate: string;
  value: number;
}

async function readNativeSamples(sinceISO: string): Promise<WearableSample[]> {
  const Health = await loadHealth();
  if (!Health) return [];

  const startDate = sinceISO;
  const endDate = new Date().toISOString();
  const out: WearableSample[] = [];

  // ── Steps (daily aggregation) ──────────────────────────────────────────
  try {
    const stepsRes: any = await Health.queryAggregated({
      startDate, endDate, dataType: "steps", bucket: "day",
    });
    const buckets: AggregatedBucket[] = stepsRes?.aggregatedData ?? stepsRes?.data ?? stepsRes ?? [];
    for (const b of buckets) {
      if (!b?.startDate) continue;
      const dayKey = (b.startDate || "").slice(0, 10);
      out.push({
        metric_type: "steps",
        value_numeric: Math.round(Number(b.value) || 0),
        unit: "count",
        start_at: new Date(b.startDate).toISOString(),
        end_at: b.endDate ? new Date(b.endDate).toISOString() : undefined,
        external_id: `steps-${dayKey}`,
      });
    }
  } catch (e) {
    console.warn("[wearables] steps query failed", e);
  }

  // ── Workouts (with HR series, calories, distance) ──────────────────────
  try {
    const workoutsRes: any = await Health.queryWorkouts({
      startDate, endDate,
      includeHeartRate: true, includeRoute: false, includeSteps: true,
    });
    const list: RawWorkout[] = workoutsRes?.workouts ?? [];
    for (const w of list) {
      if (!w?.startDate) continue;
      const hrSeries = Array.isArray(w.heartRate) ? w.heartRate.filter(h => Number(h?.bpm) > 0) : [];
      const avgHr = hrSeries.length
        ? Math.round(hrSeries.reduce((s, h) => s + Number(h.bpm), 0) / hrSeries.length)
        : null;
      const maxHr = hrSeries.length ? Math.round(Math.max(...hrSeries.map(h => Number(h.bpm)))) : null;
      const start = new Date(w.startDate);
      const end = w.endDate ? new Date(w.endDate) : start;
      const durationMin = typeof w.duration === "number"
        ? Math.round(w.duration / 60)
        : Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

      out.push({
        metric_type: "workout",
        value_numeric: durationMin,
        unit: "min",
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        source_device: w.sourceName,
        external_id: w.id ?? `workout-${start.toISOString()}`,
        payload: {
          workoutType: w.workoutType,
          duration_minutes: durationMin,
          avg_hr: avgHr,
          max_hr: maxHr,
          calories: typeof w.calories === "number" ? Math.round(w.calories) : null,
          distance_m: typeof w.distance === "number" ? Math.round(w.distance) : null,
          steps: typeof w.steps === "number" ? Math.round(w.steps) : null,
          source: w.sourceName ?? null,
          source_bundle: w.sourceBundleId ?? null,
        },
      });
    }
  } catch (e) {
    console.warn("[wearables] workouts query failed", e);
  }

  // ── Sleep / Resting HR / HRV (raw samples) ─────────────────────────────
  // Plugin returns objects shaped like:
  //   { startDate, endDate, value, unit, sourceName?, id?, samples?: [{ stage, startDate, endDate }] }
  // Sleep may include sleep-stage subsamples; we sum "asleep" minutes when
  // present, otherwise fall back to (endDate - startDate).
  async function readRaw(dataType: string): Promise<any[]> {
    try {
      const res: any = await Health.readSamples({ startDate, endDate, dataType });
      return res?.samples ?? res?.data ?? res ?? [];
    } catch (e) {
      console.warn(`[wearables] ${dataType} query failed`, e);
      return [];
    }
  }

  // Sleep
  const sleepRaw = await readRaw("sleep");
  for (const s of sleepRaw) {
    if (!s?.startDate) continue;
    const start = new Date(s.startDate);
    const end = s.endDate ? new Date(s.endDate) : start;
    let minutes: number;
    const subs = Array.isArray(s.samples) ? s.samples : null;
    if (subs && subs.length) {
      // Sum any stage that isn't explicitly "awake" / "inBed"
      minutes = 0;
      for (const sub of subs) {
        const stage = String(sub?.stage ?? sub?.value ?? "").toLowerCase();
        if (stage.includes("awake") || stage === "in_bed" || stage === "inbed") continue;
        const ss = sub?.startDate ? new Date(sub.startDate).getTime() : null;
        const se = sub?.endDate ? new Date(sub.endDate).getTime() : null;
        if (ss != null && se != null && se > ss) {
          minutes += Math.round((se - ss) / 60000);
        }
      }
      if (minutes === 0) {
        minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
      }
    } else {
      const v = Number(s.value);
      minutes = Number.isFinite(v) && v > 0
        ? Math.round(v) // already minutes
        : Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    }
    if (minutes <= 0) continue;
    out.push({
      metric_type: "sleep",
      value_numeric: minutes,
      unit: "min",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      source_device: s.sourceName,
      external_id: s.id ?? `sleep-${start.toISOString()}`,
      payload: { source: s.sourceName ?? null, raw_unit: s.unit ?? null },
    });
  }

  // Resting Heart Rate
  const rhrRaw = await readRaw("restingHeartRate");
  for (const s of rhrRaw) {
    if (!s?.startDate) continue;
    const bpm = Number(s.value);
    if (!Number.isFinite(bpm) || bpm <= 0) continue;
    const start = new Date(s.startDate);
    const end = s.endDate ? new Date(s.endDate) : start;
    out.push({
      metric_type: "resting_hr",
      value_numeric: Math.round(bpm),
      unit: "bpm",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      source_device: s.sourceName,
      external_id: s.id ?? `rhr-${start.toISOString()}`,
    });
  }

  // Heart-Rate Variability (RMSSD/SDNN, ms)
  const hrvRaw = await readRaw("heartRateVariability");
  for (const s of hrvRaw) {
    if (!s?.startDate) continue;
    const ms = Number(s.value);
    if (!Number.isFinite(ms) || ms <= 0) continue;
    const start = new Date(s.startDate);
    const end = s.endDate ? new Date(s.endDate) : start;
    out.push({
      metric_type: "hrv",
      value_numeric: Math.round(ms * 10) / 10,
      unit: "ms",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      source_device: s.sourceName,
      external_id: s.id ?? `hrv-${start.toISOString()}`,
    });
  }

  return out;
}

/**
 * Pull samples since `sinceISO` from the native health store and POST them
 * to the ingest function. Returns number of samples uploaded.
 */
export async function syncSince(sinceISO: string, deviceLabel?: string): Promise<number> {
  const provider = wearableProviderForPlatform();
  if (!provider) {
    recordSyncResult({
      ok: false,
      error: "Wearable sync only works inside the iOS or Android app. Open Sportstalent on your phone, not the browser.",
      at: Date.now(),
    });
    return 0;
  }

  try {
    const samples = await readNativeSamples(sinceISO);

    // Per-metric breakdown of what the device actually returned, before upload
    const localBreakdown: MetricBreakdown = { ...EMPTY_BREAKDOWN };
    for (const s of samples) localBreakdown[s.metric_type] += 1;
    console.info("[wearables] device returned samples:", localBreakdown, "since", sinceISO);

    const { data, error } = await supabase.functions.invoke("ingest-wearable-samples", {
      body: { provider, device_label: deviceLabel, samples },
    });
    if (error || (data as any)?.error) {
      throw new Error((data as any)?.error || error?.message || "Ingest failed");
    }
    const inserted = (data as any)?.inserted ?? 0;
    const breakdown = ((data as any)?.breakdown ?? localBreakdown) as MetricBreakdown;
    recordSyncResult({ ok: true, inserted, breakdown, at: Date.now() });
    return inserted;
  } catch (e: any) {
    recordSyncResult({ ok: false, error: e?.message || "Sync failed", at: Date.now() });
    throw e;
  }
}

// ============================================================================
// Local sync stats
// ============================================================================
const SYNC_STATS_KEY = "wearable_sync_stats";

export interface SyncStats {
  last_attempt_at: number | null;
  last_success_at: number | null;
  last_inserted: number | null;
  last_error: string | null;
  last_breakdown: MetricBreakdown | null;
  total_inserted: number;
  attempts: number;
  failures: number;
}

const EMPTY_STATS: SyncStats = {
  last_attempt_at: null,
  last_success_at: null,
  last_inserted: null,
  last_error: null,
  last_breakdown: null,
  total_inserted: 0,
  attempts: 0,
  failures: 0,
};

export function getSyncStats(): SyncStats {
  try {
    const raw = localStorage.getItem(SYNC_STATS_KEY);
    if (!raw) return { ...EMPTY_STATS };
    return { ...EMPTY_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function clearSyncStats() {
  localStorage.removeItem(SYNC_STATS_KEY);
}

function recordSyncResult(r: { ok: boolean; inserted?: number; breakdown?: MetricBreakdown; error?: string; at: number }) {
  const s = getSyncStats();
  s.attempts += 1;
  s.last_attempt_at = r.at;
  if (r.ok) {
    s.last_success_at = r.at;
    s.last_inserted = r.inserted ?? 0;
    s.last_breakdown = r.breakdown ?? null;
    s.total_inserted += r.inserted ?? 0;
    s.last_error = null;
  } else {
    s.failures += 1;
    s.last_error = r.error ?? "Unknown error";
  }
  try { localStorage.setItem(SYNC_STATS_KEY, JSON.stringify(s)); } catch {}
}

export async function getSampleCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("wearable_samples")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return count ?? 0;
}

/** 14-day initial backfill. */
export async function initialBackfill(): Promise<number> {
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  return syncSince(since);
}

/** Fetch latest connection status row for the current user. */
export async function getStatus(): Promise<WearableStatus> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { provider: null, connected: false, last_sync_at: null, last_attempt_at: null, device_label: null };

  const provider = wearableProviderForPlatform();
  const { data } = await supabase
    .from("wearable_connections")
    .select("provider,status,last_sync_at,last_attempt_at,device_label")
    .eq("user_id", user.id)
    .order("last_sync_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { provider, connected: false, last_sync_at: null, last_attempt_at: null, device_label: null };
  const row = data as any;
  return {
    provider: row.provider as WearableProvider,
    connected: row.status === "active",
    last_sync_at: row.last_sync_at,
    last_attempt_at: row.last_attempt_at ?? null,
    device_label: row.device_label,
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
// Background pull on app open (rate-limited 30 min)
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
