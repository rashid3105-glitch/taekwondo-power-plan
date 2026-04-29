## What's actually happening

Two issues, one root cause for the missing numbers:

1. **Sync says "+0" because nothing is being read from HealthKit.** The installed plugin is `capacitor-health` (Martin Ley's plugin). Its real API is `requestHealthPermissions`, `queryAggregated`, `queryWorkouts` with permission strings like `READ_STEPS`, `READ_HEART_RATE`, `READ_WORKOUTS`. Our wrapper in `src/lib/wearables/index.ts` calls non-existent methods (`requestAuthorization`, `query`, `read`) with the wrong data-type names (`sleepAnalysis`, `restingHeartRate`, etc.). Every metric loop silently fails, so the device sends an empty `samples: []` array. The edge function happily reports `inserted: 0` — that's the "+0" you see. The database confirms it: `wearable_samples` and `wearable_daily_summary` are both empty.
2. **Plugin scope is narrower than we modeled.** `capacitor-health` only exposes Steps, Active Calories, Mindfulness (aggregated) + Workouts (with HR series + calories + distance). It does **not** expose Sleep, Resting Heart Rate or HRV. We need to drop those metrics for the iOS/Android MVP and surface what we actually can read.
3. **The /wearables ↔ /wearables/sync loop** is caused by mixed back-button strategies: the Sync page hard-navigates to `/wearables`, while the Wearables page uses `navigate(-1)` (history back). After visiting Sync, history is `[…, /wearables, /wearables/sync]`; "Back" on Wearables sends you back to Sync again.

---

## The fix

### 1. Replace the native bridge with the real `capacitor-health` API

In `src/lib/wearables/index.ts`:

- Import the plugin properly: `const { Health } = await import("capacitor-health")` (only on native, behind the platform check we already have).
- Replace `requestPermissions()` to call `Health.requestHealthPermissions({ permissions: ["READ_STEPS","READ_HEART_RATE","READ_WORKOUTS","READ_ACTIVE_CALORIES","READ_TOTAL_CALORIES","READ_DISTANCE"] })`.
- Replace `readNativeSamples(sinceISO)` with two real readers:
  - `Health.queryAggregated({ startDate, endDate, dataType: "steps", bucket: "day" })` → emit one `steps` sample per day.
  - `Health.queryWorkouts({ startDate, endDate, includeHeartRate: true, includeRoute: false, includeSteps: true })` → for each workout emit one `workout` sample with `start_at`, `end_at`, `value_numeric = duration`, `source_device = sourceName`, `external_id = id`, and `payload = { avg_hr, max_hr, calories, distance, workoutType }` (compute avg/max from the returned `heartRate` array).
- Drop the `sleep`, `resting_hr`, `hrv` mapping rows.
- Keep the existing ingest call (`ingest-wearable-samples`) as-is — it already accepts these metric types.

### 2. Update what we display so it matches what we can actually pull

- **Server side** (`supabase/functions/ingest-wearable-samples`): no schema change. The `recompute_wearable_summary` RPC keeps writing `steps` to the daily summary; sleep/RHR/HRV columns simply stay null on iOS, which is fine.
- **Recovery & Wearables section on Progress page**: hide RHR/HRV/Sleep rows when there's no data and instead show:
  - "Steps (last 7 days, 30-day chart)"
  - "Workouts captured" — count + total duration + avg HR per workout, sourced from `wearable_samples` where `metric_type = 'workout'`.
- **RecoveryTile on the Dashboard hub**: same treatment — show Steps + last workout HR when sleep/HRV are null, instead of three em-dashes.

### 3. New "Health" page with detailed stats

Create `src/pages/Health.tsx` route at `/health` and add a small "Open health stats" link from `/wearables`:

- Summary header: total samples, last successful pull, connection state (compact).
- **Steps card**: 30-day bar chart (uses `wearable_daily_summary.steps`), 7-day average, today vs. yesterday delta.
- **Workouts card**: list of last 14 workouts from `wearable_samples` (date, duration, avg HR, max HR, calories, source). Tap a row to expand HR zones (computed client-side from payload).
- **HR zones card**: distribution across the last 14 days using each workout's HR average vs. theoretical zones based on `220 - profile.age`.
- All copy goes through `src/i18n/translations.ts` for the 5 supported locales.

### 4. Break the back-button loop

In `src/pages/WearablesSync.tsx` change the back button from `navigate("/wearables")` to `navigate(-1)` **only when** history length > 1, otherwise fall back to `/wearables`. And add an explicit "Done" button that pops back twice if the previous entry was `/wearables`. Symmetrically, in `WearablesSettings.tsx`, change `navigate(-1)` to `navigate("/dashboard")` so the Wearables page never sends you back into Sync.

### 5. Show the user that something happened

In `WearablesSync.tsx`, when "Sync now" returns 0 samples, show a friendlier hint instead of a silent toast: "No new data since {last_sync_at}. Open Apple Health to verify your watch is syncing, then try again."

---

## Files touched

```text
src/lib/wearables/index.ts                       (rewrite native bridge)
src/components/RecoveryTile.tsx                  (graceful empty states for sleep/RHR/HRV)
src/components/progress/RecoveryProgressSection.tsx (steps + workouts focus)
src/pages/WearablesSettings.tsx                  (back -> /dashboard, link to /health)
src/pages/WearablesSync.tsx                      (back -> -1, friendlier zero-result toast)
src/pages/Health.tsx                             (new page: steps, workouts, HR zones)
src/App.tsx                                      (register /health route)
src/i18n/translations.ts                         (new keys for Health page)
```

No DB migration. No edge function change. No new dependencies.

---

## Out of scope (call out for you)

- **Sleep, Resting Heart Rate, and HRV** are not available through `capacitor-health`. Restoring those would require swapping in a different plugin (e.g. `@perfood/capacitor-healthkit` for iOS-only HRV/RHR, plus a separate Health Connect plugin for Android). Happy to do that as a follow-up — just say the word and I'll plan it. For now the Health page will be honest about what's measured.