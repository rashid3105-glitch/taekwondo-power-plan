## Goal
In the athlete Calendar tab, the coach's team focus note (`club_week_technique_focus.coach_note`) is currently only visible after tapping a date to expand a week. Make the team focus + note visible directly in the overview so athletes don't have to click around.

## Changes (frontend only)

File: `src/components/hub/SeasonCalendarView.tsx`

1. **Auto-select the current season week on load** so the existing week-details card (which already renders team techniques + note) is open by default. Falls back to first week with focus data if today is outside the season.

2. **Add a compact "Team focus this week" banner** between the current-phase banner and the month grid. It shows, for the current season week:
   - Week number + date range
   - Team technique chips (already-loaded `teamTechIds` → names)
   - The coach's note (`teamNote`) in quotes
   - "Ingen teknikfokus sat" empty state when the coach hasn't filled it in yet (uses existing `seasonTeamFocusNotSet` translation key)
   
   The banner is always visible (no click needed) and is the primary fix for "right now it does not show anything".

3. **Tooltip on day cells**: add `title={teamNote}` on cells where the week has a coach note, so hovering/long-pressing a day surfaces it too.

No backend, schema, or business-logic changes. Data is already fetched by the existing effect — only presentation changes.

## Out of scope
- Coach-side `SeasonCalendar.tsx` editor (already shows the note inline in the edit panel).
- Hub mini calendar (`SeasonCalendarMini.tsx`) — different surface, can be a follow-up if you want the note there too.