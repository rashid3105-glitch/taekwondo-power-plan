// Multi-metric "Quick export" from iPhone Health (HealthKit) or Health Connect.
// Inspired by the Swift HealthDataType enum pattern: user picks one or more
// metrics, we request only those permissions in a single sheet, query the
// last 7 days of daily stats, and offer a .txt / .csv download.

import { wearableProviderForPlatform } from "@/lib/wearables";

export type MetricKey =
  | "stepCount"
  | "heartRate"
  | "activeEnergy"
  | "restingHr"
  | "hrv"
  | "sleep";

export interface MetricDef {
  key: MetricKey;
  /** Default English display name (UI may override via i18n). */
  displayName: string;
  /** Permission string accepted by capacitor-health. */
  permission: string;
  /** dataType passed to Health.queryAggregated. */
  dataType: string;
  /** Unit suffix shown next to values. */
  unit: string;
  /** Aggregation strategy across the day. */
  aggregation: "sum" | "avg";
}

export const HEALTH_METRICS: Record<MetricKey, MetricDef> = {
  stepCount: {
    key: "stepCount",
    displayName: "Step Count",
    permission: "READ_STEPS",
    dataType: "steps",
    unit: "count",
    aggregation: "sum",
  },
  heartRate: {
    key: "heartRate",
    displayName: "Heart Rate (avg)",
    permission: "READ_HEART_RATE",
    dataType: "heart-rate",
    unit: "bpm",
    aggregation: "avg",
  },
  activeEnergy: {
    key: "activeEnergy",
    displayName: "Active Energy",
    permission: "READ_ACTIVE_CALORIES",
    dataType: "active-calories",
    unit: "kcal",
    aggregation: "sum",
  },
  restingHr: {
    key: "restingHr",
    displayName: "Resting Heart Rate",
    permission: "READ_RESTING_HEART_RATE",
    dataType: "resting-heart-rate",
    unit: "bpm",
    aggregation: "avg",
  },
  hrv: {
    key: "hrv",
    displayName: "Heart-Rate Variability",
    permission: "READ_HEART_RATE_VARIABILITY",
    dataType: "heart-rate-variability",
    unit: "ms",
    aggregation: "avg",
  },
  sleep: {
    key: "sleep",
    displayName: "Sleep",
    permission: "READ_SLEEP",
    dataType: "sleep",
    unit: "min",
    aggregation: "sum",
  },
};

export const ALL_METRIC_KEYS: MetricKey[] = Object.keys(HEALTH_METRICS) as MetricKey[];

export interface DailyRow {
  date: string;   // YYYY-MM-DD
  value: number;
  unit: string;
}

export type MetricResults = Record<MetricKey, DailyRow[]>;

// ─── Plugin loader (cached, mirrors lib/wearables/index.ts approach) ────────
let _Health: any | null = null;
let _HealthPromise: Promise<any | null> | null = null;
async function loadHealth(): Promise<any | null> {
  if (_Health) return _Health;
  if (!wearableProviderForPlatform()) return null;
  if (_HealthPromise) return _HealthPromise;
  _HealthPromise = (async () => {
    try {
      const mod: any = await import(/* @vite-ignore */ "capacitor-health");
      _Health = mod?.Health ?? null;
      return _Health;
    } catch (e) {
      console.warn("[quickExport] capacitor-health import failed", e);
      return null;
    }
  })();
  return _HealthPromise;
}

export async function preloadQuickExport(): Promise<void> {
  await loadHealth();
}

/**
 * Request HealthKit / Health Connect permissions for ONLY the metrics passed.
 * MUST be called synchronously inside a user gesture on iOS (no awaits before).
 */
export async function requestPermissionsFor(metrics: MetricDef[]): Promise<void> {
  if (!metrics.length) return;
  const Health = _Health ?? (await loadHealth());
  if (!Health) throw new Error("HealthKit bridge is not available in this build.");
  const permissions = Array.from(new Set(metrics.map(m => m.permission)));
  await Health.requestHealthPermissions({ permissions });
}

interface AggBucket {
  startDate?: string;
  endDate?: string;
  value?: number;
  count?: number;
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Query 7 days of daily aggregates for each selected metric, in parallel. */
export async function queryLast7DaysMulti(metrics: MetricDef[]): Promise<MetricResults> {
  const Health = _Health ?? (await loadHealth());
  const out = {} as MetricResults;
  if (!Health || !metrics.length) {
    metrics.forEach(m => { out[m.key] = []; });
    return out;
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 86400_000);
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  await Promise.all(metrics.map(async (m) => {
    try {
      const res: any = await Health.queryAggregated({
        startDate: startISO,
        endDate: endISO,
        dataType: m.dataType,
        bucket: "day",
      });
      const buckets: AggBucket[] = res?.aggregatedData ?? res?.data ?? res ?? [];
      const rows: DailyRow[] = [];
      for (const b of buckets) {
        if (!b?.startDate) continue;
        const raw = Number(b.value ?? 0);
        let value = raw;
        if (m.aggregation === "avg") {
          // capacitor-health's daily bucket value for avg metrics is already
          // the period mean; if it returned a sum + count, divide it.
          const cnt = Number((b as any).count ?? 0);
          if (cnt > 0 && raw > cnt * 10) value = raw / cnt;
        }
        if (!Number.isFinite(value)) continue;
        if (m.aggregation === "sum") {
          value = Math.round(value);
        } else {
          value = Math.round(value * 10) / 10;
        }
        rows.push({
          date: toDayKey(b.startDate),
          value,
          unit: m.unit,
        });
      }
      // Sort newest first
      rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      out[m.key] = rows;
    } catch (e) {
      console.warn(`[quickExport] query failed for ${m.dataType}`, e);
      out[m.key] = [];
    }
  }));

  return out;
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatAsText(results: MetricResults, metrics: MetricDef[]): string {
  const lines: string[] = [];
  lines.push(`iPhone Health export — generated ${new Date().toISOString()}`);
  lines.push("");
  for (const m of metrics) {
    const rows = results[m.key] ?? [];
    lines.push(`Health Data: ${m.displayName} (Last 7 Days)`);
    lines.push("---");
    if (!rows.length) {
      lines.push("(no data)");
    } else {
      for (const r of rows) {
        lines.push(`${r.date}: ${r.value.toLocaleString("en-US")} ${r.unit}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function formatAsCsv(results: MetricResults, metrics: MetricDef[]): string {
  const lines = ["metric,date,value,unit"];
  for (const m of metrics) {
    const rows = results[m.key] ?? [];
    for (const r of rows) {
      lines.push(`${csvEscape(m.displayName)},${r.date},${r.value},${r.unit}`);
    }
  }
  return lines.join("\n");
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Trigger a browser-style download. Works in iOS WKWebView (Capacitor). */
export function downloadFile(filename: string, content: string, mime: string) {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (e) {
    console.warn("[quickExport] download failed, falling back to data URL", e);
    const url = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
    window.open(url, "_blank");
  }
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
