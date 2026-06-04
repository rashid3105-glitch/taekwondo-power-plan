## Problem

On mobile, the dashboard header is a single row:

`[logo + SPORTSTALENT] ... [ClubSwitcher] [LanguageSwitcher] [EventReminders] [avatar] [hamburger]`

When the active club has a long name ("Copenhagen City..."), the `ClubSwitcher` expands and pushes the avatar + hamburger off-screen. Result:
- Club selector overlaps the "SPORTSTALENT" wordmark.
- The right-side menu (avatar + burger) is invisible.

We previously agreed to move the club selector down to its own row.

## Fix

In `src/pages/Dashboard.tsx` header (around lines 613–662), restructure into two rows on mobile:

**Row 1 (always visible):**
- Left: logo + `SPORTSTALENT` wordmark.
- Right: `LanguageSwitcher`, optional coach season-calendar button, `EventRemindersDropdown`, avatar button, hamburger menu button. (Same components as today — just without the `ClubSwitcher`.)

**Row 2 (mobile only):**
- Full-width `ClubSwitcher` below row 1, only rendered on `sm:hidden`.

**Desktop (`sm:` and up):**
- Keep the existing single-row layout: include `ClubSwitcher` inline in row 1 right side (where there is room). Hide the mobile second row via `sm:hidden`.

This guarantees the avatar and hamburger always stay on screen on mobile regardless of club name length, while the club selector gets its own full-width row below.

## Files to edit

- `src/pages/Dashboard.tsx` (header block only, ~lines 613–662)
- `src/pages/CoachDashboard.tsx` (apply the same two-row pattern if it shares the same overflow issue — verify first; only edit if confirmed)

## Out of scope

No changes to `ClubSwitcher` internals, role logic, routing, RLS, or other tabs.
