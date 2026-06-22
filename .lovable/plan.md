## Problem

In the athlete Calendar tab, the top banner correctly shows the current week (e.g. "Uge 3 · 2026-06-22 – 2026-06-28"), but the highlighted week in the grid and the detail card below show the previous week ("Uge 2 · 2026-06-15 – 2026-06-21").

## Root cause

`src/components/hub/SeasonCalendarView.tsx` initializes `selectedWeek` with `useState(initialWeek)` based on `seasonPlan.start_date` at first render. `useState`'s initializer only runs once — when `seasonPlan` later changes (e.g. superadmin switches club, or the plan loads asynchronously after the component mounts with a stale plan), `selectedWeek` stays stuck on the week number computed against the old start date. That's why "today's week" in the banner (recomputed every render) and "selected week" diverge by one.

## Fix (frontend only, single file)

In `src/components/hub/SeasonCalendarView.tsx`:

- Add a `useEffect` that re-syncs `selectedWeek` to the current week whenever `seasonPlan.start_date`, `seasonPlan.end_date`, or `today` changes:
  - If today falls inside the new plan → `setSelectedWeek(seasonWeekNumber(start, today))`
  - Otherwise → `setSelectedWeek(null)`
- Keep the existing manual click behavior (toggle on/off) untouched — the effect only fires on plan/date changes, not on user clicks.

No backend, no schema, no business-logic changes. Pure presentation sync.

## Out of scope

- Coach-side `SeasonCalendar.tsx`
- Hub mini calendar
- Any week-number / Monday-anchor math in `seasonCalendar.ts` (already correct, banner proves it)
