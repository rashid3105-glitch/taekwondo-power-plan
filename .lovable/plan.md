## Problem
The "Månedligt fremmøde" dialog (`AttendanceStatsDialog`) and `CoachToday` query `session_attendance` rows by `coach_id` only. When a coach belongs to multiple clubs, rows from all clubs are mixed together, so the team rate and per-athlete counts don't reflect the currently active club.

## Fix
Filter `session_attendance` reads by the active club so each club has its own attendance stats.

### Changes
1. **`src/components/coach/AttendanceStatsDialog.tsx`**
   - Accept `activeClubId: string | null` prop.
   - In the month-load query, add `.eq("club_id", activeClubId)` when `activeClubId` is set.
   - Re-run on `activeClubId` change.

2. **`src/pages/CoachToday.tsx`**
   - Pass `activeClubId` (already read from `useActiveClub()`) into `<AttendanceStatsDialog />`.
   - The athletes list is already filtered by active club here, so per-athlete grouping stays correct.

3. **Any other call site of `AttendanceStatsDialog`** — search and pass the same prop (likely only `CoachDashboard`/`CoachToday`).

No DB/migration changes needed — `session_attendance.club_id` already exists and is populated by the `stamp_club_id_from_athlete` trigger. Historical rows where `club_id` is NULL will be excluded from a club-scoped view; if that matters we can backfill in a follow-up, but the user's ask is about correctness going forward.
