## Goal
On the coach Season Calendar, each TKD-day cell should display the team's focus technique names (small chips) instead of the current 🎯 marker. The Uge detail panel below stays as-is.

## Scope
File: `src/pages/SeasonCalendar.tsx` only.

## Changes

1. In the month-grid cell renderer (around lines 957–991):
   - Remove the `🎯` `<span>` (line 987–989).
   - When `hasFocus` is true and `inSeason`, render the technique names for that week as small chips:
     - Resolve names via the existing `techniques` array using `weekFocusMap.get(wk)?.technique_ids`.
     - Render up to 2 chips at `text-[8px]`/`text-[9px]`, `truncate`, primary-tinted background (`bg-primary/15 text-primary`), stacked or wrapped at the bottom of the cell.
     - If more than 2 techniques exist, show `+N` chip for the remainder.
   - Keep the existing session-type label (`{t(sessionLabelKey(s.type))}`) — chips go below it.
   - Slightly raise cell `min-h` (e.g. from `min-h-[46px]` to `min-h-[58px]`) so chips fit without breaking the grid.

2. No data-layer changes — `weekFocusMap` and `techniques` are already loaded.
3. No translations needed (chip text is the technique name).

## Out of scope
- Athlete `SeasonCalendarView.tsx` (athlete view) — not touched unless requested.
- Uge detail panel — no change.
