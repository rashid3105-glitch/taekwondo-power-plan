## Edit + delete tournament (coach)

**Where:** `src/pages/CoachCompetitions.tsx` — the bottom sheet that opens when a coach taps a competition card (currently shows title, date, location, participants).

### 1. Pencil "edit" button
- Add a small pencil (`Pencil` icon) button in the sheet header, right beside the title.
- Clicking it toggles inline edit mode with three fields:
  - **Navn** (name)
  - **Dato** (event_date, date input)
  - **Sted** (location)
- "Gem" and "Annullér" buttons appear while editing.
- On save: `UPDATE competitions SET name/event_date/location` for **all rows** in the group (one row per athlete) — matched by the current name+date+location key. Local `comps` state and `openGroup` update in place.

### 2. Delete panel at the bottom of the sheet
- New separated red panel below participants:
  - Label: "Slet stævne" + short helper text explaining every athlete's registration will be removed.
  - Red `Trash2` button "Slet stævne".
- Clicking opens an `AlertDialog` confirmation ("Er du sikker? Alle X deltageres tilmeldinger fjernes. Handlingen kan ikke fortrydes.") with Cancel / Slet.
- On confirm: `DELETE FROM competitions WHERE id IN (all participant comp ids for this group)` — removes every athlete's row so no dangling references remain. Also best-effort deletes any `competition_reflection_requests` tied to those ids. Sheet closes, list refreshes.

### 3. i18n
Add 7-language keys: `editCompetition`, `saveChanges`, `cancel` (reuse if exists), `deleteCompetition`, `deleteCompetitionHelper`, `deleteCompetitionConfirm`, `competitionUpdated`, `competitionDeleted`.

### 4. Scope
- No backend/schema/RLS changes — existing coach RLS on `competitions` already permits update/delete for their club's athletes (same permission used by the current "Fjern" per-participant button).
- No changes to the create dialog or list rendering beyond re-fetch after edit/delete.
