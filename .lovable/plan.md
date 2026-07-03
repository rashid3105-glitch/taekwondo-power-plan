Move the two configuration cards on the coach dashboard to the bottom of the page, just above the "KLUB-MEDLEMMER" section.

## What
On `/coach` (`src/pages/CoachDashboard.tsx`), these two cards currently appear right after the action buttons and before the squad content:
- `TeamWeeklyScheduleCard` (Holdets standard-ugeplan)
- `ClubActivityTypesCard` (Aktivitetstyper (egen træning))

Move them to the bottom of the page, directly above the foldable "KLUB-MEDLEMMER" (Club Members) section.

## How
1. Remove the two card lines from their current position around line 446–447.
2. Insert them just above the `clubAthletes.length > 0 &&` block that renders the Club Members section (around line 537).
3. Keep the existing `coachClubId` guard and styling unchanged.

No other component, translation, or backend changes are required.

## Verification
- Preview the `/coach` page and confirm the two cards render below the squad list and directly above the Club Members section.
- Confirm the cards still only appear when a club is selected and remain functional.