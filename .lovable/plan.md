# Multi-Metric HealthKit Picker & Export

Same Swift-inspired pattern, but the user can **tick multiple metrics** in one go. Permissions are requested as a single batch (one Health sheet) and results are shown per-metric, with combined export.

## What you'll see in the app

A new **"Quick export"** card on the Health page (`/health`):

```text
┌──────────────────────────────────────────┐
│  Quick export from iPhone Health         │
│  Pick one or more metrics, last 7 days   │
│                                          │
│  [x] Step Count                          │
│  [x] Active Energy                       │
│  [ ] Heart Rate (avg)                    │
│  [ ] Resting Heart Rate                  │
│  [ ] HRV                                 │
│  [ ] Sleep                               │
│                                          │
│  [ Select all ]  [ Clear ]               │
│                                          │
│  [ Grant access & load 7 days ]          │
│                                          │
│  ── Step Count ─────────────────────     │
│  2026-04-30   8,432 count                │
│  2026-04-29  10,118 count   …            │
│                                          │
│  ── Active Energy ──────────────────     │
│  2026-04-30   612 kcal      …            │
│                                          │
│  [ Download .txt ]  [ Download .csv ]    │
└──────────────────────────────────────────┘
```

Behavior:
- Checkboxes for all 6 metrics; **Select all / Clear** helpers; the action button is disabled until at least one is selected.
- Tapping **Grant access & load 7 days** asks Health for **only the selected metrics' permissions** in a single sheet (mirrors the Swift example, just with an array instead of one value).
- Each selected metric renders its own 7-row daily section.
- One **.txt** and one **.csv** download contain *all* selected metrics:
  - `.txt` — sections per metric, matching Swift's `Health Data: <name> (Last 7 Days)\n---\n…` format
  - `.csv` — single sheet with columns `metric,date,value,unit`
- File names: `iphone-health-export-YYYY-MM-DD.txt` / `.csv`.

The existing full "Connect & sync everything" wizard is untouched — this card is a lighter, additional path.

## Files to add / change

- **`src/lib/wearables/quickExport.ts`** *(new)* — TypeScript port of your Swift `HealthDataType` enum, extended for multi-select:
  - `HEALTH_METRICS`: `stepCount | heartRate | activeEnergy | restingHr | hrv | sleep` → `{ key, displayName, permission, dataType, unit, aggregation: "sum" | "avg" }`.
  - `requestPermissionsFor(metrics)` — calls `Health.requestHealthPermissions({ permissions: metrics.map(m => m.permission) })` synchronously inside the user gesture (same iOS rule we already follow).
  - `queryLast7DaysMulti(metrics)` — runs `Health.queryAggregated({ ..., bucket: "day" })` for each metric in parallel, returns `Record<MetricKey, { date, value, unit }[]>`. For `avg` metrics (HR / HRV) we average client-side from the daily sums + counts the plugin returns.
  - `formatAsText(results)` / `formatAsCsv(results)` — combined exports across all selected metrics.
  - `downloadFile(filename, content, mime)` — Capacitor `Filesystem` + `Share` plugin on iOS if available, otherwise a normal Blob download.

- **`src/components/health/QuickExportCard.tsx`** *(new)* — the UI card above. Built from existing `Card`, `Button`, `Checkbox` (shadcn) using semantic tokens only (`text-foreground`, `border-border`, `text-primary`, `bg-muted`). Haptics: `tap()` on toggle/action, `success()` after a successful query.

- **`src/pages/Health.tsx`** *(edit)* — mount `<QuickExportCard />` just under the connection strip. Visible whenever the device is in the native shell or already connected.

- **`src/i18n/translations.ts`** *(edit)* — add strings across DA / EN / SV / DE / AR (per the i18n rule):
  `quickExportTitle`, `quickExportSubtitle`, `quickExportSelectAll`, `quickExportClear`, `quickExportLoad`, `quickExportLoading`, `quickExportEmpty`, `quickExportPermissionDenied`, `quickExportDownloadTxt`, `quickExportDownloadCsv`, plus the six metric names (`metricStepCount`, `metricHeartRate`, `metricActiveEnergy`, `metricRestingHr`, `metricHrv`, `metricSleep`).

## Mapping from your Swift code → this app

| Swift                                       | TypeScript equivalent                                                            |
|---------------------------------------------|----------------------------------------------------------------------------------|
| `enum HealthDataType`                       | `HEALTH_METRICS` const map                                                       |
| `exportHealthData(for choice:)` (single)    | `exportHealthData(for choices: [HealthDataType])` — accepts an array             |
| `requestAuthorization(toShare:read:[type])` | `Health.requestHealthPermissions({ permissions: [...selected] })`                |
| `HKStatisticsCollectionQuery` (per type)    | `Health.queryAggregated({ dataType, bucket: "day" })` — one call per metric, run in `Promise.all` |
| `queryOption` (sum vs average)              | `aggregation` field on each metric; we average HR / HRV client-side               |
| `writeToFile(content, fileName)`            | `downloadFile()` — Capacitor Filesystem + Share on iOS, Blob on web              |

## Why this approach (no native Swift changes)

The existing `capacitor-health` plugin already forwards `requestHealthPermissions` to `HKHealthStore.requestAuthorization` and `queryAggregated` to `HKStatisticsCollectionQuery`, so we get exactly the Swift behavior — including the single-sheet multi-permission prompt — by passing the right arrays from TypeScript. No Xcode work, no native rebuild beyond the standard `npm run build && npx cap sync ios`.

## Out of scope (ask if you want any of these)

- Date-range picker (fixed to 7 days, matching your Swift example).
- Saving the exported numbers into Supabase (export stays on the device).
- Adding a chart per metric in the export card (the existing Health page already charts the synced metrics).
