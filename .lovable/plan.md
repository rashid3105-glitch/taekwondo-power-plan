## Where Apple Watch / Health Connect data shows today

Currently your wearable stats appear in **3 places only**:

1. **Dashboard hub** — small `RecoveryTile` (yesterday's Sleep / RHR / HRV with trend arrows vs 7-day baseline). Only shown if the athlete has `owns_wearable = true`.
2. **Readiness check-in card** — auto-prefills sleep + HRV from yesterday's wearable summary so the athlete doesn't have to retype it.
3. **Coach view** (`CoachAthleteDetail`) — a 7-day `AthleteRecoveryTrend` sparkline trio for each athlete.
4. **Workout logs** — wearable workout match silently attached (avg HR, max HR, duration, calories) but **never visualised**.

Also exists but only on dedicated pages: `/wearables` (settings) and `/wearables-sync` (status / sample count).

So today the **Progress tab shows nothing from the watch** — which is exactly the gap you noticed. Yes, this would be a strong addition: the Progress page is where athletes already look for trends, and recovery data tells the most important story (training load vs sleep/HRV).

---

## Plan: add a "Recovery" section to the Progress page

Add a new section at the top of `ProgressDashboard.tsx`, only rendered when `profile.owns_wearable` is true and at least one summary row exists. Keeps the page clean for non-wearable users.

### Section contents

1. **30-day trend chart (3 lines)** — Sleep hours, Resting HR, HRV RMSSD on a shared time axis. Toggle chips to focus on one metric. Uses existing recharts pattern from the rest of the page.
2. **Weekly averages strip** — last 7d vs previous 7d for each metric, with up/down delta and a red flag if RHR ↑>5 bpm or HRV ↓>8 ms (same thresholds already used in `AthleteRecoveryTrend`).
3. **Training load vs recovery overlay** — small bar+line combo: weekly training minutes (from `workout_logs` already used in this page) overlaid with average HRV. Lets the athlete spot when load is outpacing recovery.
4. **Workout intensity rows** — for each logged workout in the period that has `avg_hr` / `calories` from the watch, show the values inline in the existing volume list. Tiny watch icon next to wearable-sourced rows.

### Empty / fallback states

- No wearable connected → section hidden entirely.
- Wearable connected but <3 days of data → show a soft "Collecting data — come back in a few days" placeholder with link to `/wearables-sync`.

### Technical details

- New component `src/components/progress/RecoveryProgressSection.tsx` (keeps `ProgressDashboard.tsx` from growing further).
- Reads `wearable_daily_summary` for last 30 days in one query (RLS already restricts to own user).
- Reuses `RecoveryTrendDay` shape from `src/lib/wearables`.
- For workout intensity, extend the existing workout query in `ProgressDashboard` to also `select` `avg_hr, max_hr, duration_minutes, calories, wearable_source` (already on `workout_logs`).
- All new strings added to `src/i18n/translations.ts` for da/en/sv/de/ar.
- No backend / RLS / migration changes — all data already exists, we're just surfacing it.
- Hidden by default for accounts without `owns_wearable`, so non-watch users see no change.

### Out of scope (ask if you want them later)

- Sleep stage breakdown (deep/REM) — not currently ingested.
- Strain / training-load score — would need a model; can add as a follow-up.
- Coach-facing version on the Progress tab in `CoachAthleteDetail` — the coach already has the 7-day sparkline; happy to extend if you want parity.
