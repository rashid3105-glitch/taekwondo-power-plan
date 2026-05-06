## Goal
Show the weekly training plan as a multi-week progression grid (like the mockup): rows = days, columns = weeks, with each cell showing the same exercises plus a per-week progression badge (e.g. `+5 lbs`, `+1 rep`).

## Why this fits the project
Plans already store:
- A single `weeklySchedule` (one base week with days → sessions → exercises)
- `programWeeks` (4–12, total program length)
- A `periodization` array (Accumulation → Intensification → Peaking → Deload) tied to week ranges

So we have everything needed to **render** N weeks without changing the AI generator or the data model — the per-week progression is computed from the periodization phase that contains each week.

## What the user will see
On the Plan tab, replace the current "day buttons + single day detail" layout with a **week × day matrix**:

```text
            WEEK 1 (ACCUM)   WEEK 2 (ACCUM)   WEEK 3 (INTENS)  WEEK 4 (PEAK)
DAY 1 GYM   Squat  4x8        Squat  4x8 +5    Squat  5x5 +10   Squat  3x3 +15
            Press  3x10       Press  3x10      Press  4x6 +5    Press  3x4 +10
            Deadlift 1x5      Deadlift 1x5+5   Deadlift 1x3+10  Deadlift 1x1+15

DAY 2 TKD   Kicks block       …                …                …
```

- Header row: `WEEK 1`, `WEEK 2`, … up to `programWeeks`, with a small phase tag (Accumulation / Intensification / Peaking / Deload) and matching color from existing `PHASE_META`.
- Left column: day label + session-type icon (existing `TYPE_BADGES`).
- Cells: list of exercises (compact) with a progression chip in the corner (`+5 lbs`, `+1 rep`, `–10% vol` for deload, etc.).
- Today's week column gets a subtle highlight; current day row too.
- Tap a cell → opens the existing day detail (logging, drag-reorder, coach feedback) for **that specific week**, so workout logs continue to be keyed by date.
- On mobile (<640px): horizontal scroll-snap with sticky day column on the left (one week visible at a time, swipe between weeks). On desktop: full grid visible, max ~6 weeks before horizontal scroll.

## Progression rules (deterministic, no AI call)
For each exercise, derive week-N values from the base week + the periodization phase covering week N:

| Phase            | Sets/reps tweak              | Load tweak                    |
|------------------|-------------------------------|--------------------------------|
| Accumulation     | Base sets × base reps         | Base load + (weekInPhase × 2.5%)|
| Intensification  | Sets +1, reps –30%            | Base load + 7.5–10%            |
| Peaking          | Sets same, reps –50%          | Base load + 12–15%             |
| Deload           | Sets –1, reps same            | Base load – 20%                |

Numbers shown as relative chips (`+5 lbs`, `–1 rep`) compared to week 1 to match the mockup vibe. Bodyweight / mobility exercises only show set/rep changes (no load chip). All thresholds live in one helper so they're easy to tune.

## Toggle
Add a small segmented control above the grid: **Week view** (current single-week behavior) ↔ **Program view** (new multi-week grid). Default = Program view if `programWeeks > 1`, else Week view. Setting persists in `localStorage`.

## Out of scope
- No DB/schema changes.
- No edge function changes (generator stays the same).
- Logging, drag-reorder, exercise picker, PDF export, calendar export — all unchanged; clicking a cell reuses the existing day-detail panel.

## Technical details
- New component: `src/components/plan/PlanProgramGrid.tsx` — pure presentational, takes `plan_data`, `programWeeks`, `periodization`, `onCellClick(weekIndex, dayIndex)`.
- New helper: `src/lib/planProgression.ts` — `computeWeekVariant(exercise, weekIndex, periodization)` returning `{ sets, reps, loadDeltaPct, displayChip }`.
- Edit `src/components/AIPlanCard.tsx`:
  - Add view toggle state.
  - When in Program view, render `PlanProgramGrid` instead of the day-button row.
  - Cell click sets `selectedDay` + a new `selectedWeek` state; pass `selectedWeek` to the day-detail header so users see "Week 3 · Tuesday".
- Reuse existing tokens: `PHASE_META.colorClass`, `TYPE_BADGES`, `bg-secondary`, `border-border`, `shadow-card`. No new colors.
- i18n: add keys `programView`, `weekView`, `weekN` (with `{n}` interpolation), `phaseAccumulationShort`, `phaseIntensificationShort`, `phasePeakingShort`, `phaseDeloadShort` across DA/EN/SV/DE/AR/NO. Phase short labels already exist in `PHASE_META.short` — reuse.
- Mobile: CSS `scroll-snap-type: x mandatory` on the grid wrapper, `sticky left-0` on the day column.
- Accessibility: each cell is a `<button>` with `aria-label="Week 3, Tuesday, Gym"`, focus ring uses existing primary token.

## Validation
- Generate / open an existing plan with `programWeeks = 8` → grid shows 8 columns, progression chips visible from week 2 onward.
- Tap any cell → day detail opens, header shows correct week + day, logging still writes for today's date.
- Switch toggle → returns to current single-week UI unchanged.
- Mobile viewport (375px) → horizontal swipe between weeks, day column sticks.
- RTL (Arabic) → grid mirrors correctly (use logical properties / `rtl:` variants).
