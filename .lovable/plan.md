## Problem

`GlobalAppMenu` renders a fixed hamburger button at `position: fixed; right: 8px; top: safe-area+8px; z-index: 60`. It floats on top of every page — including sticky page headers that themselves place icons on the right side (language switcher, tab shortcuts, event reminders bell, club switcher, etc.). On mobile this button sits directly over those icons, as seen on `/coach` where it covers the language flag chip.

## Fix

Give the floating menu a dedicated safe zone that headers respect, instead of moving the menu itself.

1. **Add a right-side padding utility for headers.** In `src/index.css`, add a small helper class (e.g. `.pr-app-menu`) that reserves ~48px on the right (matches the ghost icon button width) plus a bit of breathing room. Use it wherever we render a sticky/top header that has right-aligned controls.

2. **Apply it to the sticky headers that currently collide with the hamburger:**
   - `src/pages/CoachDashboard.tsx` — header row containing "I dag", "Sæsonkalender", `<LanguageSwitcher />`, and the `ClubSwitcher` row below.
   - `src/pages/Dashboard.tsx` — athlete dashboard sticky header (EventRemindersDropdown + LanguageSwitcher area).
   - `src/pages/Health.tsx`, `src/pages/Diary.tsx`, `src/pages/Messages.tsx`, `src/pages/CoachMessages.tsx`, `src/pages/CoachToday.tsx`, `src/pages/CoachCompetitions.tsx`, `src/pages/SeasonCalendar.tsx`, `src/pages/Library.tsx`, `src/pages/Profile.tsx`, `src/pages/Help.tsx` — any page whose top bar has right-side icons/buttons.
   
   Concretely: add the padding class to the header's inner container (the flex row), so the right-aligned cluster is pushed left of the floating hamburger.

3. **Verify** by loading `/coach`, `/dashboard`, `/health`, `/diary` on the mobile viewport in the preview and confirming the hamburger no longer overlaps flags, bells, or action buttons.

No behavior changes, no removed features — purely a spacing fix so the always-on-top menu button gets its own lane.

## Technical notes

- The reserved width should be `~3rem` (48px) to clear the `size="icon"` button plus the 8px right offset already used by the floating trigger.
- Prefer a Tailwind arbitrary value `pr-[3.25rem]` (or the new utility class) on the header's inner row, rather than editing the `container` class globally, to avoid affecting page content below the header.
- No change to `GlobalAppMenu.tsx` itself — its z-index and position stay as they are so it remains reachable on every page.
