# Monthly Attendance Stats Modal

Add a stats button in the `/coach/today` header (where the red circle is in the screenshot) that opens a modal showing each athlete's attendance for a selected month. Also add an icon legend at the top of the existing Today list so coaches know what ✅ / 🕐 / ❌ mean.

## UI

**Icon legend** (`src/pages/CoachToday.tsx` — above `<SessionAttendance>`)
- Small horizontal strip with three chips:
  - ✓ icon (emerald) — "Present"
  - 🕐 icon (orange) — "Late"
  - ✕ icon (red) — "Absent"
- Same icons/colors used inside `SessionAttendance` buttons so it acts as a true legend.

**Header button**
- Add a `BarChart3` icon button on the right side of the `/coach/today` header, opens the stats modal.

**New component**: `src/components/coach/AttendanceStatsDialog.tsx`
- Dialog with:
  - Month picker (prev/next arrows + current month label, defaults to current month).
  - Summary strip: total sessions held that month, team attendance rate %.
  - Same icon legend at the top of the dialog.
  - Per-athlete list, sorted alphabetically:
    - Avatar + name
    - Counts: ✓ present / 🕐 late / ✕ absent
    - Attendance % (present + late = attended)
    - Avg RPE across attended sessions
    - Small progress bar visualizing attendance %.
- Loading + empty state ("No sessions recorded this month").

## Data

Query `session_attendance` for the coach, filter `session_date` between month start/end. Aggregate client-side per `athlete_id`. Athletes list passed from `CoachToday` (already loaded).

- Sessions held that month = distinct `session_date` count.
- Per athlete: counts by status, % = (present + late) / sessionsHeld, avg rpe over non-null rows.

## Translations (all 7 locales in `src/i18n/translations.ts`)
`attendanceStats`, `monthlyAttendance`, `sessionsHeld`, `teamAttendanceRate`, `present`, `late`, `absent`, `attendanceRate`, `avgRpe`, `noSessionsThisMonth`, `legend`.

## Files touched
- `src/pages/CoachToday.tsx` (header button + legend strip + dialog state)
- `src/components/coach/AttendanceStatsDialog.tsx` (new)
- `src/i18n/translations.ts` (new keys × 7 locales)

No DB, RLS, or edge-function changes.