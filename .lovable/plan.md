# Add Sleep, Resting HR, and HRV from Apple Health / Health Connect

Good news: no new plugin needed. The `capacitor-health` plugin already installed (v8.1.0) supports `sleep`, `restingHeartRate`, and `heartRateVariability` via its `readSamples` method. The previous integration just didn't call them. We'll wire them up, request the right permissions, and surface the data on the Health page, the Recovery tile, and the readiness prefill.

## What changes for the user

- iPhone (and Android via Health Connect) will now share Sleep duration, Resting Heart Rate, and HRV with the app.
- The Health page gets three new cards: Sleep (last 7 nights), Resting HR (trend + 7-day baseline), HRV (trend + 7-day baseline).
- The Recovery tile on the Progress page shows last night's sleep, RHR vs baseline, and HRV vs baseline (instead of only steps/workouts).
- Morning readiness check-in is prefilled from yesterday's sleep when available.
- The first-time permission prompt now also asks for Sleep / Heart Rate / HRV access.
- Sync Status page shows per-metric counts (Steps, Workouts, Sleep, RHR, HRV) so you can see exactly what was ingested.

## Technical changes

1. **`src/lib/wearables/index.ts`**
   - Extend `PERMISSIONS` with `READ_SLEEP`, `READ_RESTING_HEART_RATE`, `READ_HEART_RATE_VARIABILITY`.
   - In `readNativeSamples`, add three calls to `Health.readSamples({ dataType, startDate, endDate })` for `sleep`, `restingHeartRate`, `heartRateVariability`.
   - Map results into `WearableSample` rows:
     - `sleep` → `metric_type: "sleep"`, `value_numeric` = minutes between start/end (sum of asleep states if the plugin returns sleep stages; otherwise total duration), `unit: "min"`.
     - `restingHeartRate` → `metric_type: "resting_hr"`, `value_numeric` = bpm, `unit: "bpm"`.
     - `heartRateVariability` → `metric_type: "hrv"`, `value_numeric` = ms (RMSSD/SDNN as returned), `unit: "ms"`.
   - Use stable `external_id`s (e.g. `sleep-<startISO>`, `rhr-<startISO>`, `hrv-<startISO>`) so re-syncs don't duplicate.
   - Update the file's header comment (it currently says these metrics aren't supported — that's stale).

2. **No DB or edge function changes** — the schema and `recompute_wearable_summary` already handle `sleep`, `resting_hr`, `hrv`. Once samples land, the daily summary and 7-day baselines populate automatically.

3. **`src/pages/Health.tsx`**
   - Pull `wearable_daily_summary` for the last 30 days.
   - Add three cards under the existing Steps card:
     - Sleep: line/bar of nightly minutes, "last night" highlight, 7-day average.
     - Resting HR: line of daily RHR with the 7-day baseline overlay.
     - HRV: line of daily HRV with the 7-day baseline overlay.
   - Each card shows an empty state ("Grant Sleep / Heart access in Apple Health → Sources → SPORTS TALENT") if no samples in the window.

4. **`src/components/RecoveryTile.tsx` and `src/components/progress/RecoveryProgressSection.tsx`**
   - Restore the sleep / RHR / HRV blocks (they were removed when we thought the plugin couldn't supply them).
   - Use `wearable_daily_summary` for yesterday + 7-day baseline; show deltas (e.g. "RHR 54 bpm, ‑3 vs 7-day").

5. **`src/pages/WearablesSync.tsx`**
   - In the post-sync summary, break down inserted samples per metric (the ingest function already returns `inserted`; we'll additionally query counts per `metric_type` for the synced window so the UI can show "Sleep: 6, RHR: 7, HRV: 7, Steps: 14, Workouts: 3").
   - Update the "0 samples" guidance to mention enabling Sleep / Heart Rate / HRV in Apple Health → Sharing → SPORTS TALENT.

6. **`src/i18n/translations.ts`**
   - Add labels for the new cards, empty states, and permission copy across DA / EN / SV / DE / AR.

## iOS / Android prerequisites (one-time, user-side)

- iOS Info.plist already has `NSHealthShareUsageDescription` (set when capacitor-health was first added). No change needed.
- After this update the user must:
  1. `git pull`, `npm install`, `npx cap sync ios` (and/or `android`).
  2. Reinstall the app on the device (a permission scope change requires re-prompting).
  3. On first launch, grant the new Sleep / Heart Rate / HRV toggles in the Apple Health permission sheet (or in Health Connect on Android).

## Out of scope

- No change to the database schema, RLS, or edge functions.
- No change to the workout auto-attach logic.
- No new third-party plugin.
