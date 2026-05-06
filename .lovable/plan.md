## Issue
The Program-view toggle and multi-week grid only appear when `programWeeks > 1`. All existing plans in the DB (including your current active one) were generated before the `programWeeks` field existed — `plan_data` only has `planName`, `weeklySchedule`, and `periodization`. So `programWeeks` falls back to `1`, the toggle is hidden, and you see the old single-week UI.

## Fix
Derive `programWeeks` from the periodization phases when the field is missing, so existing plans get the new view too.

### Change in `src/components/AIPlanCard.tsx`
Replace:
```ts
const programWeeks = Math.max(1, Number(plan.plan_data?.programWeeks) || 1);
```
with a helper that uses the explicit field when set, otherwise reads the highest `weekRange` end from `periodization` (e.g. `[{weekRange:[1,3]}, {weekRange:[4,6]}, {weekRange:[7,8]}]` → 8). If neither exists, default to **6** (a reasonable program length) so the new grid is visible on every plan.

### Optional polish
- Keep the toggle visible even when `programWeeks === 1` so users can discover it (just hide the grid in that edge case).
- Add a tiny "NEW" pill next to the **Program** toggle button for one release so it's noticeable.

## Out of scope
No DB migration, no edge-function change, no regenerating old plans. Purely a frontend fallback.

## Validation
- Open your current plan at `/dashboard?tab=plan` → toggle visible, Program view shows ~6 week columns with progression chips derived from existing `periodization`.
- Generate a new plan with `programWeeks = 8` → grid shows exactly 8 columns (explicit field wins).
- Plan with no periodization at all → toggle hidden, week view as before.
