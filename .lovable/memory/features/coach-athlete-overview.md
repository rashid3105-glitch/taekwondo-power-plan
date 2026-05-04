---
name: Coach Athlete Overview Page
description: Dedicated /coach/athlete/:id page with KPI strip, sessions vs planned chart, FormCurve, recovery trend, test comparison, upcoming comps. Squad cards navigate here instead of opening a Drawer.
type: feature
---

## Route
`/coach/athlete/:athleteId` (in App.tsx) → `src/pages/CoachAthleteOverview.tsx`. Coach role check + auto-redirect to /coach if athlete not found.

## Page structure
- **Sticky header**: avatar, name, club/belt/discipline/code badges, injury + no-plan chips, action buttons (Reminder, Diary).
- **2 tabs (URL-synced via `?tab=`):**
  - `overview` (default) — `<AthleteOverviewTab />`
  - `manage` — reuses existing `<CoachAthleteDetail />` (its 4 internal tabs intact)

## AthleteOverviewTab (`src/components/coach/AthleteOverviewTab.tsx`)
KPI strip (4): readiness (latest + 7d avg), sessions 8w (logged/planned + completion%), mood avg 14d, upcoming comps count.
Charts:
- Sessions vs planned (8 weeks bar chart, color-coded by ratio)
- `<FormCurveChart userId={athleteId} />`
- `<AthleteRecoveryTrend />` (auto-hides without wearable data)
- `<PhysicalTestComparison />`
Plus: upcoming comp list + latest PR + quick-jump cards (Season planner, Match analysis).

## Squad navigation
`SquadOverview.onSelectAthlete` in `CoachDashboard.tsx` now calls `navigate(\`/coach/athlete/\${id}\`)`. The old Dialog/Drawer render block was removed.

## Data sources (no new RPCs)
- `workout_logs`, `competitions`, `diary_entries`, `readiness_checkins`, `physical_test_results` — direct table reads
- Existing RPCs reused via child components: `compute_form_curve` (FormCurve), `get_athlete_recovery_trend`, `get_club_test_medians`
