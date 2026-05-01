## Diagnosis (verified against the database)

For your account (`117a…b70`):

- `health_data` (raw iPhone table) has **1 row**: today, with `steps=1810, hr=67, hrv=29.95`.
- `wearable_daily_summary` (the table the Health page reads) has **31 rows**, all with `steps=0` and `resting_hr=null/hrv=null` — including today, even though `health_data` clearly has values for today.

So the sync isn't broken in the "no data arrived" sense — your iPhone numbers **are** in `health_data`. They're getting **destroyed** every time the resync runs, which is exactly what you described ("don't delete the numbers for the previous days").

### Why the numbers get wiped

The `resync-health` Edge Function does two steps:

1. **Mirror** `health_data` → `wearable_daily_summary` with a JS-side COALESCE merge. This part is fine for days that have a `health_data` row.
2. **Call `recompute_wearable_summary` RPC** for the whole 30-day window.

The RPC reads from `wearable_samples` (which is **empty** for your user — no Apple Watch sample stream is being written) and then runs an `INSERT … ON CONFLICT DO UPDATE SET steps = EXCLUDED.steps, resting_hr = EXCLUDED.resting_hr, …` for **every day** in the window. Because `wearable_samples` is empty, EXCLUDED is all zeros/nulls, and that wipes whatever the trigger or step 1 just wrote. That's how today's row ended up with `steps=0` even though `health_data` has 1810.

It also explains the 30 zero-rows for April: nothing is creating them legitimately, the recompute is just inserting empty placeholders for each calendar day.

## Plan

### 1. Stop the destructive recompute (server-side)

In `supabase/functions/resync-health/index.ts`:

- Remove the `await admin.rpc("recompute_wearable_summary", …)` call. We don't have `wearable_samples` data flowing in for HealthBridge users, so this RPC has no useful inputs and only causes damage.
- Replace it with a small inline baseline-only update: recompute `baseline_hr_7d` and `baseline_hrv_7d` for the affected window using a single `UPDATE … FROM (SELECT … AVG …)` against `wearable_daily_summary` itself. This keeps the trend chart baselines fresh without ever overwriting `steps`, `sleep_minutes`, `resting_hr`, or `hrv_rmssd`.

This is a code-only change to the edge function — no DB migration required.

### 2. Make the mirror step strictly additive

Still in `resync-health/index.ts`, in the per-row mirror loop:

- Today's bug: when `health_data.sleep_hours = 0`, we currently mirror `sleep_minutes = 0`, which can clobber a real manual entry. Treat `0` as "no signal" for sleep specifically and skip writing it (use `null` and let COALESCE on the next pass keep the existing value).
- Same defensive treatment for `steps = 0`: never overwrite a previously-non-zero value with 0. If incoming steps is 0/null, fall back to existing.
- Keep the existing `read → merge → upsert` pattern, but tighten the merge so a missing/zero incoming field never beats a real stored value.

### 3. Backfill / repair the existing damage

One-time cleanup for the current user state, no code change:

- Delete summary rows that are pure zeros and have no corresponding `health_data` row, so the chart stops showing a flat line of fake zeros for April. (We'll do this via a migration — run once.)
- Re-mirror today's row from `health_data` so `2026-05-01` shows `1810 steps / HR 67 / HRV 29.95` instead of all zeros.

### 4. Make the Health overview resilient on the client

In `src/pages/Health.tsx` `load()`:

- Today the page reads `wearable_daily_summary` first and uses `health_data` only to fill nulls. Flip the priority so that for any date where `health_data` has a non-null value, that value wins over a 0/null in the summary table. This means even if the mirror is briefly behind, the chart shows the iPhone numbers immediately.
- Drop the silent auto-resync from rendering empty placeholder days. Only render days that have at least one non-null metric, so a fresh user never sees a "wall of zeros".

### 5. Verify

After the changes:

- Hit the Health page once → it should show today's 1810 steps, HR 67, HRV 29.95 immediately from `health_data`, even before the resync finishes.
- Click the manual Sync button → today's summary row should be repaired to `steps=1810, hr=67, hrv≈30`. The April zero-rows should be gone.
- Add a manual sleep entry for yesterday → run sync again → the manual sleep value must still be there afterwards (this is the "don't delete previous days" guarantee).

## Out of scope

- We're **not** wiring up `wearable_samples` ingestion in this pass. As long as HealthBridge writes to `health_data`, the mirror + COALESCE + baseline-only recompute is enough.
- No changes to the auto-sync throttling logic from the previous round.