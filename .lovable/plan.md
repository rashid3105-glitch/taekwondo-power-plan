
## Problem

On `/dashboard?tab=calendar` (`SeasonCalendarView`) the competitions list is only used to tint a day red — the tournament **name** never appears, and the query is hard-scoped to `user_id = auth user`. A coach viewing the tab (or an athlete whose competitions live under another club context) sees an empty calendar even though tournaments exist in "Stævneoversigt".

## Goal

Make tournaments from the competitions list visible in the season calendar:
1. Show tournament **name** on the correct day cell.
2. Show tournaments for the **currently active club** (respecting `ClubSwitcher`), not just rows owned by the logged-in user.
3. Add a small **"Stævner denne uge"** list to the week focus card above the grid.

## Scope of changes

Only `src/components/hub/SeasonCalendarView.tsx` (frontend/presentation). No DB, no RLS, no edge functions.

### Data loading

Replace the current `competitions` query with a club-scoped one:

- Read `activeClubId` from `useActiveClub()`.
- Fetch `competitions` with `id, name, event_date, user_id, priority` filtered by:
  - `event_date` between `seasonPlan.start_date` and `seasonPlan.end_date`, AND
  - `club_id = activeClubId` (falls back to `user_id = auth.user.id` when `activeClubId` is null, preserving current athlete-only behavior).
- Deduplicate multi-athlete entries by `(event_date, name)` so the same tournament isn't rendered N times.
- Keep the existing `competitionDates: Set<string>` (used by `resolveSessionsForDate`) and add a new `competitionsByDate: Map<string, {name, priority}[]>`.

### Rendering

- **Day cell**: under the date number, render up to 1 tournament name as a compact `text-[8px]` red pill (`bg-destructive/20 text-destructive`) with a `Trophy` icon; `+N` overflow badge if more. Full names shown via `title` tooltip.
- **Week focus card** (existing card at top): append a "Stævner denne uge" row listing tournaments whose `event_date` falls in `wkStart`–`wkEnd`, each as a small chip with date + name.
- No layout/spacing overhaul — reuse existing pill/chip styles from the technique focus rows.

### Safety

- Coaches now see club-wide tournaments — this is the desired behavior and matches how `SeasonCalendar.tsx` (coach page) already works.
- No text is hardcoded: new labels ("Stævner denne uge", empty state) go through `t()` in all 7 languages via `src/i18n/translations.ts`.

## Out of scope

- No changes to coach `SeasonCalendar.tsx` (already shows competitions).
- No new tables, RLS, or edge functions.
- No changes to how tournaments are created/edited.
