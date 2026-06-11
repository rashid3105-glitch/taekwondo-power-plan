## Cause
The "I dag" card in `src/components/hub/AthleteDashboard.tsx` reads `plan_data.days` or `plan_data.week`, but the active plan structure is actually `plan_data.weeklySchedule` (array indexed Mon=0..Sun=6, with `sessions[]` containing `label`, `focus`, `type`, `exercises[]`). The lookup returns nothing, so the card always shows the empty state even when training is scheduled.

## Changes — `src/components/hub/AthleteDashboard.tsx`

1. **Extend the data shape and fetch**
   - Add `label?: string`, `focus?: string`, `exercises: string[]` to `TodaySession`.
   - When loading the plan, use `plan_data.weeklySchedule ?? plan_data.days ?? plan_data.week` so existing formats still work.
   - Pick today's day with the existing `(todayDow + 6) % 7` index.
   - From the first non-empty session, capture: `label` (fallback to `type`/`focus`/"Træning"), `focus`, and the first ~5 exercise names (`exercises.map(e => e.name).filter(Boolean)`).

2. **Render exercise headlines**
   - Keep the existing title row (session label) and tags.
   - Below the tags, render a short bullet list of up to 5 exercise names (`text-xs text-white/80`, leading-tight, truncated). If more than 5 exist, append a muted `+N flere` line.
   - Keep the card clickable to `/dashboard?tab=plan` and the Start chip.

3. **No empty-state change** when a real session exists; "Ingen træning planlagt i dag" still shows when `weeklySchedule` is missing or the day is a rest day with no exercises.

## Out of scope
- No DB changes, no edits to the Plan/Uge view, no translation additions (Danish-only hub copy is consistent with the surrounding card).
