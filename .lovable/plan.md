

## Strengthen the Coach toolkit

The Coach Dashboard today lets coaches add/create athletes, view diaries, manage individual profiles/plans, send reminders, and run physical tests. What's missing is the **stuff that makes a coach's day-to-day actually faster**: a single overview to spot who's drifting, the ability to act on multiple athletes at once, private notes, and session attendance. Here's a focused set of additions, ranked by impact.

### 1. Squad Overview dashboard (highest impact)

A new tab/section at the top of the Coach Dashboard that shows the entire roster as a sortable, scannable grid of "athlete tiles":

```text
┌──────────────────────────────────────────────────────────────┐
│  SQUAD OVERVIEW             [All ▼] [Sort: Needs attention ▼]│
├──────────────────────────────────────────────────────────────┤
│  Alex H.   ●●●○○ readiness · Mood 😟 · 0 sessions logged 7d  │
│            ⚠ Missed 2 of 4 planned · Last seen 6d ago        │
│  Sara K.   ●●●●● readiness · Mood 😀 · 5 sessions / 6 plan   │
│  Lina M.   ⚠ Injury logged · No rehab plan yet               │
└──────────────────────────────────────────────────────────────┘
```

For each athlete, show pulled from existing tables: latest readiness score, latest diary mood, completion rate (workout_logs vs planned this week), days since last login (`profiles.last_seen_at`), active injury flag, and whether a plan exists. Color the row red/amber/green so a coach scanning the page knows in 5 seconds who to call.

Sort presets: "Needs attention" (red first), "By name", "By belt", "Last active".

### 2. Coach private notes per athlete

Tiny but missed feature. A free-text notes panel inside the existing "Manage athlete" drawer (`CoachAthleteDetail.tsx`) — "Bjarne is recovering from ankle sprain — keep volume <60%". Only the coach sees it; not exposed to the athlete or other coaches. New table `coach_athlete_notes` with strict RLS.

### 3. Session attendance / RPE tracking

A new "Today's session" view scoped to one date. Coach sees their list of athletes for the day, taps each row to mark **Present / Absent / Late** and optionally enters a perceived-effort score (RPE 1–10). Useful for in-person clubs and feeds the same Squad Overview signals.

Stored in new table `session_attendance (athlete_id, coach_id, session_date, status, rpe, notes)`.

### 4. Bulk actions

In the athlete list, allow selecting multiple athletes and:
- Send one reminder to all selected (reuses `SendReminderDialog`)
- Generate plans for all selected with the same parameters (program length, goals)
- Export a combined PDF of selected athletes' active plans

### 5. Weekly squad export

One click → a PDF that shows the upcoming week for the entire roster (one row per athlete, columns Mon–Sun with session type + key exercise). Useful for printing and bringing to training. Reuses existing PDF export utilities.

### 6. Athlete progress comparison

Inside any athlete's "Manage" drawer, add a small "Compare to club average" widget for physical test results — bar chart showing the athlete vs the median of their club for each test. Pure SQL aggregation, no AI cost.

### What we deliberately keep out (for now)

- Live messaging / chat — large surface area, better as Phase 2.
- Video upload + technique review — needs storage policy work and would inflate scope.
- Calendar sync from coach side — `.ics` already exists athlete-side; sufficient for now.

---

### Technical notes

**New DB migration (one file):**
- `coach_athlete_notes (id, coach_id, athlete_id, content, created_at, updated_at)` — RLS: only the coach who wrote it can SELECT/INSERT/UPDATE/DELETE. Unique `(coach_id, athlete_id)` so it's one rolling notes doc per pair.
- `session_attendance (id, coach_id, athlete_id, session_date, status, rpe int CHECK 1..10, notes, created_at)` — RLS: coach can manage rows where `coach_id = auth.uid()` AND athlete is linked via `coach_athletes` or shares club.
- Add a SECURITY DEFINER function `get_squad_overview(_coach_id uuid)` returning one JSON row per athlete: profile basics + latest_readiness + latest_mood + sessions_logged_7d + planned_sessions_7d + has_active_injury + last_seen_at + has_active_plan. This avoids 6 round-trip queries in the UI.

**Frontend:**
- New `src/components/coach/SquadOverview.tsx` — the scannable grid, calls `supabase.rpc("get_squad_overview")` on mount and every 60s.
- New `src/components/coach/CoachNotes.tsx` — auto-saves on blur; mounted inside `CoachAthleteDetail.tsx`.
- New `src/components/coach/SessionAttendance.tsx` — date-scoped roster with Present/Absent/Late chips + RPE slider; mounted as a top tab on Coach Dashboard.
- New `src/components/coach/BulkActionsBar.tsx` — appears when ≥1 athlete checkbox is selected in the athlete list; surfaces "Remind", "Generate plans", "Export PDF".
- New `src/components/coach/WeeklySquadExport.tsx` — small button in header that builds the combined PDF using existing jsPDF helpers.
- New `src/components/coach/PhysicalTestComparison.tsx` — bar chart inside `CoachAthleteDetail`.

**Routing/nav:**
- Re-organize Coach Dashboard into 3 tabs: **Overview** (new), **Athletes** (existing list), **Today** (attendance). Use existing `Tabs` component.

**Translations:** ~35 new keys in `src/i18n/translations.ts` across all 6 locales.

**Privacy:**
- Coach notes never returned by any public RPC and never visible to athletes (no client-side query path exists for athletes).
- `get_squad_overview` only returns rows for athletes the calling coach is linked to or shares a club with — matches existing `coach_athletes` + `users_share_club` patterns.

