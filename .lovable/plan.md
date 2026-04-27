# Wearables MVP — Apple Watch & Android (Wear OS / Health Connect)

## Goal

Let athletes connect their watch/phone health data so the app auto-fills **morning readiness**, enriches **workout logs**, and gives coaches a **recovery/load signal** — without forcing manual entry.

Ask athletes if they own a wearable. Only show menu to those answering yes. Should be able to change the answer in the athletes profile.

We start narrow: **passive read-only sync of 5 metrics**, no live workout streaming, no writing back to the watch.

## Scope (in)

MVP supports two ingestion paths:

1. **Apple Watch** → HealthKit (via the iOS Capacitor wrapper)
2. **Android phone + Wear OS** → Health Connect (via the Android Capacitor wrapper)

Both feed the **same backend table** (`wearable_samples`) through one normalized edge function. The web app keeps working unchanged for users without a watch.

### MVP metrics (only these 5)


| Metric                                          | Used for                                                     |
| ----------------------------------------------- | ------------------------------------------------------------ |
| Sleep duration (last night)                     | Auto-fills `sleep_hours` in ReadinessCard                    |
| Resting heart rate (daily)                      | Trend signal; flags elevation vs 7-day baseline              |
| HRV (RMSSD, nightly)                            | Readiness amber/red trigger when ↓ vs baseline               |
| Steps (daily)                                   | Activity load context for coach                              |
| Workout sessions (type, duration, avg HR, kcal) | Auto-creates a `workout_logs` row tagged `source='wearable'` |


## Scope (out — explicitly deferred)

- Live in-workout HR streaming
- Writing workouts/plans back to the watch
- Standalone Wear OS / watchOS apps (we use the phone as the bridge)
- ECG, blood oxygen, temperature, menstrual data
- Garmin / Polar / Whoop / Coros (post-MVP — same table, new providers)

## User flow

```text
Settings → "Connect your watch"
  ├─ iOS build  → "Connect Apple Health"  → HealthKit permission sheet
  └─ Android    → "Connect Health Connect" → Health Connect permission sheet
                                              (installs HC if missing)

Once granted:
  • Initial backfill: last 14 days
  • Background sync: on app foreground + every ~3h while open
  • Status chip on Dashboard: "Synced 12 min ago · Apple Watch"
  • Disconnect button revokes permissions and stops sync
```

## UX touchpoints

- **ReadinessCard**: when wearable data exists for last night, sleep slider + HRV-driven hint pre-fill; user can still override before submitting. A small "from Apple Watch" / "from Health Connect" badge appears.
- **Dashboard hub**: new "Recovery" mini-tile shows last-night sleep, resting HR vs baseline, HRV trend arrow.
- **Workout logging**: if a wearable workout overlaps the planned session, the log screen offers "Import from watch" to pre-fill duration + avg HR.
- **Coach view (Activity tab)**: 7-day sparkline of sleep / HRV / resting HR per athlete; flagged red dot when 2+ metrics below baseline.
- **Settings → Wearables**: connection status, last sync time, per-metric toggles, Disconnect.

## Data model (new)

```text
wearable_connections
  user_id, provider ('apple_health' | 'health_connect'),
  status, granted_scopes[], connected_at, last_sync_at, device_label

wearable_samples       (append-only, RLS: owner-only)
  id, user_id, provider, metric_type, value_numeric, unit,
  start_at, end_at, source_device, external_id (dedup), payload jsonb

wearable_daily_summary (1 row per user per day, derived)
  user_id, date, sleep_minutes, resting_hr, hrv_rmssd, steps,
  workout_count, baseline_hr_7d, baseline_hrv_7d
```

A nightly + on-ingest trigger recomputes `wearable_daily_summary` and updates the user's 7-day baselines.

## Architecture

```text
 iOS app  ──HealthKit──┐
                       ├──► Capacitor plugin
 Android ─Health Conn──┘     (normalizes to Sample[])
                              │
                              ▼
                    POST /ingest-wearable-samples   (edge function)
                              │
                              ▼
                wearable_samples ──trigger──► wearable_daily_summary
                              │
                              ▼
              Readiness + Dashboard + Coach Activity tab
```

### Edge functions (new)

- `ingest-wearable-samples` — validated batch insert (Zod, 10KB chunks, dedup on `external_id`)
- `wearable-status` — returns last-sync per provider for the Settings screen
- `disconnect-wearable` — marks connection revoked, optional purge

## Mobile integration

The app is already Capacitor-ready (per project conventions). MVP uses community plugins so we ship without writing native code:

- **iOS**: `capacitor-health` (HealthKit) — read-only scopes for sleep, HR, HRV, steps, workouts
- **Android**: `capacitor-health-connect` — same metric set; prompt to install Health Connect if missing
- A thin TS wrapper (`src/lib/wearables/`) exposes one API: `connect()`, `sync(sinceISO)`, `disconnect()`, `getStatus()` — platform branched internally.

PWA / web users see: "Wearables require the iOS or Android app — install from the Install page."

## Privacy & compliance

- Permissions requested **per metric**, not all-or-nothing
- Settings shows exactly what is read and a one-tap **Disconnect & delete** (purges `wearable_samples` + summaries)
- Data already covered by existing GDPR export (`export-my-data`) — extend it to include the two new tables
- Privacy Policy gets a "Wearable data" section in all 5 languages

## Offline behavior

- Samples collected while offline are kept in the existing IndexedDB outbox pattern (mirrors `readinessSyncEngine`) and POSTed on reconnect
- Daily summary recomputes server-side, so out-of-order arrivals are safe

## Rollout

1. Behind a feature flag `wearables_mvp` (admin-toggle per user) for internal testing
2. Pilot with Farooq's club (10–15 athletes mixed iOS/Android)
3. Open to all paying tiers; demo accounts get read-only preview

## Success criteria

- ≥60% of pilot athletes connect within first week
- ≥40% of morning readiness submissions are wearable-prefilled
- Coach Activity tab surfaces ≥1 actionable "low recovery" flag per week per active athlete
- Zero RLS regressions in security scan

## Out-of-scope follow-ups (post-MVP roadmap)

1. Garmin Connect (OAuth, server-pull)
2. Live in-session HR for the workout logger
3. Standalone watchOS / Wear OS companion app to log sets directly from the wrist
4. Auto-suggest deload week when HRV trend ↓ for 7 days