# Restore the coach ⇄ athlete switcher in athlete mode

## What's missing

When the nav redesign landed (message #1973–1974), only **one direction** got a visible toggle:

- **Coach mode bottom nav** has a 5th tab `Mig` → `setCoachAthleteMode("athlete")`. ✅
- **Athlete mode bottom nav** has no equivalent button back to coach. ❌

The side-menu still has a `Coach` entry, but it just `navigate("/coach")` — it doesn't flip `coachAthleteMode` and isn't where you put it before. That's why it feels gone.

## Fix

Add a small **"Coach" pill** in the dashboard header (visible only when `isCoach`) that toggles `coachAthleteMode` back to `"coach"`. Mirrors the coach-mode `Mig` tab — symmetrical, always reachable, no nav reshuffle needed.

### `src/pages/Dashboard.tsx`
- In the header's right-side button group (next to `LanguageSwitcher` / avatar / Menu), insert a button rendered only when `isCoach && coachAthleteMode === "athlete"`:
  - Icon: `Users` (lucide, already imported).
  - Label: `t("coachDashboard")` (key already exists in all 7 locales).
  - `onClick`: `setCoachAthleteMode("coach")` + haptic tap.
  - Styled as a compact rounded pill so it fits the header on the 730px viewport: `flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1.5 text-xs font-semibold hover:bg-accent`.
- Remove the now-redundant `Coach → /coach` button in the slide-out menu (lines 629–634). The header pill replaces it; the bottom-nav already takes coaches into the coach surface.

### No other files
- Bottom nav, `CoachDashboard.tsx`, translations, RLS — all untouched.
- The pill flips state in place; coach-mode bottom nav then takes over and exposes Hold / Træning / Stævner / Beskeder / Mig as before.

## Out of scope
Re-architecting the menu or the coach landing route — not needed for the switcher to reappear.
