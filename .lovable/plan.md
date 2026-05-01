## Goal

On top of the previously approved 7-day chart + per-metric toggles + tooltips, add a **"Re-sync from iPhone"** action button on the Health page that performs a server-side **backfill** of the last 30 days from `health_data` into `wearable_daily_summary` and recomputes the 7-day baselines.

Important framing for the user: the website cannot read HealthKit. The iPhone HealthBridge app is what pushes raw rows into `health_data`. This button takes whatever the phone has already pushed and (re)mirrors it into the dashboard's summary table — useful when:
- a row landed in `health_data` but the trigger ran before all fields were present,
- baselines look stale,
- the user manually edited rows and wants the rolling 7-day averages refreshed.

## What changes

### 1. New Edge Function: `resync-health`

Location: `supabase/functions/resync-health/index.ts`

Behavior:
- Validates the caller's JWT in code (per project pattern), reads `auth.uid()`.
- For that user, selects the last 30 days from `health_data`.
- For each row, performs the same upsert into `wearable_daily_summary` that the existing `mirror_health_data_to_summary` trigger does (using the service role to bypass RLS):
  - steps, sleep_minutes (sleep_hours × 60, rounded), resting_hr, hrv_rmssd
  - `ON CONFLICT (user_id, summary_date) DO UPDATE` with `COALESCE(EXCLUDED.x, s.x)` so manual entries are never wiped.
- After the upserts, calls the existing `recompute_wearable_summary(user_id, from, to)` Postgres function once, with `from = today-30` and `to = today`, to refresh the 7-day baselines for the whole window.
- Returns `{ ok: true, days_synced: N, from, to }`.
- CORS handled via `corsHeaders` import.
- Input validation with Zod (empty body OK; optional `days: 1..90`, default 30).

No new tables, no schema changes, no RLS changes. The function uses the SECURITY DEFINER RPC + service role for the upserts, and only ever touches the caller's own `user_id`.

### 2. UI button on `src/pages/Health.tsx`

- New "Re-sync from iPhone" button, placed in the page header row (next to the title), `variant="outline" size="sm"`, with a `RefreshCw` icon.
- On click:
  1. Sets a local `syncing` state, spins the icon (`animate-spin`).
  2. Calls `supabase.functions.invoke('resync-health')`.
  3. On success: `toast.success(...)` with "Synced N days from iPhone", then re-runs `load()` to refresh the page.
  4. On error: `toast.error(...)` with the error message; logs to console.
  5. Triggers `haptics.tap()` per project mobile baseline.
- Button is `h-11` on mobile per project Core rules.
- Disabled while `syncing` is true.

### 3. Helper text near the button

A single muted line under the button:
> "Pulls the last 30 days from your iPhone's HealthBridge sync and refreshes your 7-day baselines."

(Translatable via i18n.)

### 4. i18n

Add to `src/i18n/translations.ts` (DA, EN, SV, DE, AR):
- `healthResyncButton` — "Re-sync from iPhone"
- `healthResyncHint` — explanatory line above
- `healthResyncSuccess` — "Synced {n} days from iPhone"
- `healthResyncError` — "Sync failed. Please try again."

## Files touched

- **New**: `supabase/functions/resync-health/index.ts`
- **Edited**: `src/pages/Health.tsx` (button + handler, on top of the previously planned overview chart and tooltips)
- **Edited**: `src/i18n/translations.ts` (4 new keys × 5 languages)

## Out of scope

- No deep link to the iOS app (could be added later as `healthbridge://sync` if you confirm a URL scheme).
- No DB schema changes.
- No coach-side button — coaches still see the trigger-mirrored data automatically.
