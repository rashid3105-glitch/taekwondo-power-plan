## Goal
On the Competitions page, hide all weight/weight-cut features when the athlete's discipline is `poomsae` (forms only — no weight classes).

## Changes

**File: `src/pages/Competitions.tsx`**

1. On load, fetch `profiles.discipline` for the current user and store as `isPoomsae = discipline === "poomsae"`.
2. When `isPoomsae`:
   - Hide the "Today's weight" quick-log card (Scale icon block).
   - Hide the "Weight class (kg)" input in the Create Competition dialog; do not send `weight_class_kg`.
   - In the competition list cards, hide the weight-class badge and the weight-cut "current → target / on track / behind" status block.
3. When `isPoomsae` is false (sparring), keep current behavior unchanged.

## Notes
- Frontend-only change. No DB or edge function changes — `weight_class_kg` simply stays null for poomsae athletes.
- No change to past competitions, reflections, plan generation, or coach views (out of scope).