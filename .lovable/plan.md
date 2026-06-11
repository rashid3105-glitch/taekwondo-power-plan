## Goal
Make the athlete-side Sæsonkalender (`SeasonCalendarView`) reliably load the right plan and surface a hint when no team techniques are configured yet.

## Changes

### 1. Auto-pick the active plan covering today — `src/pages/Dashboard.tsx`
Replace the current `.maybeSingle()` query (which arbitrarily returns one of multiple active plans) with a small selection step:

- Fetch **all** active plans for the club (with nested phases + day templates).
- Pick the plan whose `start_date ≤ today ≤ end_date`.
- If multiple match, pick the one with the most recent `start_date`.
- If none match, fall back to the most recently started active plan.

Only this single block (~lines 442–466) changes; the rest of the loading logic stays the same.

### 2. Empty-state hint — `src/components/hub/SeasonCalendarView.tsx`
Compute `hasAnyTeamFocus = [...weekFocusMap.values()].some(v => v.teamTechIds.length > 0)`.

When the plan has at least one TKD day in the template **and** `hasAnyTeamFocus` is false, render a muted one-liner just above the calendar `<Card>`:

> "Holdets ugefokus er endnu ikke sat" (DA) / "Team weekly focus is not set yet" etc.

Implementation: a small `<p className="text-xs text-muted-foreground italic px-1">` inside the existing wrapper. No layout shift, no extra cards.

### 3. Translation key
Add `seasonTeamFocusNotSet` to `src/i18n/translations.ts` for all 7 locales (en, da, sv, de, ar, no, es).

## Out of scope
- Coach-side `SeasonCalendar.tsx` (already shows chips correctly when configured).
- Deduplicating active plans at the DB level — handled purely in client selection.
- Changing the chip rendering itself (already in place from previous turns).
