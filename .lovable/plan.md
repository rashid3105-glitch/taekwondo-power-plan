## Goal

Right now your iPhone bridge writes daily rows into `health_data`, but the **Health** page (and the coach-side recovery widgets) read from `wearable_daily_summary`. So nothing shows up. We'll fix it on two levels:

1. **DB trigger** — every insert/update on `health_data` automatically mirrors into `wearable_daily_summary`. This means the coach Recovery views, the form-curve job, and any other consumer of `wearable_daily_summary` light up too — no extra frontend work needed anywhere else.
2. **Health page merge** — the page also reads `health_data` directly and merges it with `wearable_daily_summary`, so older manual entries and brand-new iPhone syncs both render even if the trigger is briefly behind.

After this, your iPhone tap → "Sync" → Health page refresh shows the last 7 days of steps, sleep, resting HR and HRV with charts.

---

## Step 1 — Database trigger (mirror `health_data` → `wearable_daily_summary`)

Create a trigger that runs on every insert/update of `health_data` and upserts the matching daily summary row.

Mapping:

```text
health_data.steps          → wearable_daily_summary.steps
health_data.sleep_hours    → wearable_daily_summary.sleep_minutes  (× 60)
health_data.heart_rate_avg → wearable_daily_summary.resting_hr
health_data.hrv            → wearable_daily_summary.hrv_rmssd
health_data.date           → wearable_daily_summary.summary_date
health_data.user_id        → wearable_daily_summary.user_id
```

After upserting the row, the trigger calls the existing `recompute_wearable_summary(user_id, date, date)` function so the 7-day baselines for HR and HRV are refreshed automatically — that's what powers the "vs baseline" stats on the page.

`SECURITY DEFINER` so it bypasses RLS, scoped `search_path = public` for safety.

## Step 2 — Backfill existing rows

Run a one-time UPSERT to mirror everything currently in `health_data` into `wearable_daily_summary`, then call `recompute_wearable_summary` per affected user so existing iPhone syncs show up immediately on first load.

## Step 3 — Health page reads both tables and merges

In `src/pages/Health.tsx`:

- Keep the existing `wearable_daily_summary` query for 30 days.
- Add a parallel query against `health_data` (RLS already lets the user read their own rows) selecting `date, steps, sleep_hours, heart_rate_avg, hrv` for the same window.
- Merge by date in JS: for each day, prefer the `wearable_daily_summary` row; if a field is `null` there but present in `health_data`, fill it in (converting `sleep_hours` → minutes).
- All the existing chart logic, "today / 7-day avg / vs baseline" cards, and empty-states keep working unchanged because they consume the merged `DailyRow[]`.

This guarantees:
- The Health page shows iPhone data instantly (via direct `health_data` read), even before the trigger has populated the summary.
- Coach recovery views and the form-curve calculation still see the data (via the trigger-mirrored `wearable_daily_summary`).

## Step 4 — Verify end-to-end

1. Open the Health page → confirm last sync from iPhone shows up under Steps/Sleep/RHR/HRV.
2. Tap "Sync" again on iPhone → refresh page → today's row updates.
3. Check coach view (`AthleteRecoveryTrend`) for an athlete who synced → trend chart populates.

---

## Technical notes

- The trigger uses `INSERT … ON CONFLICT (user_id, summary_date) DO UPDATE` so re-syncs on the same day overwrite cleanly.
- We only fill non-null fields from `health_data` so manual entries via `ManualHealthEntryCard` (which writes directly to `wearable_daily_summary`) are never clobbered by a sparser iPhone payload.
- `recompute_wearable_summary` is called inside the trigger with a 1-day window — cheap, and it refreshes the 7-day rolling baselines for that date.
- No frontend type changes needed; `DailyRow` already covers all four metrics.
- No schema changes to `health_data` or `wearable_daily_summary` — purely additive (one trigger function, one trigger, one backfill, one merged query).