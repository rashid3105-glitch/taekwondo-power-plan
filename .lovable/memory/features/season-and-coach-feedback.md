---
name: Season Planner & Per-Exercise Coach Feedback
description: Macro season planner (/season) with periodization phases + auto-seeded competitions, plus per-exercise coach reactions/comments via workout_log_feedback
type: feature
---

## Season Planner (`/season`, `src/pages/SeasonPlan.tsx`)
- Single active `season_plans` row per user. Athletes manage their own; coaches can view all club athletes and edit/insert for managed athletes (RLS).
- `src/lib/seasonPlan.ts` defines `PHASE_META` (labelKey + colorClass + defaults) and `generateDefaultPhases()` which seeds GPP → SPP → competition prep → peak → deload → transition around A-priority competitions pulled from the `competitions` table.
- `SeasonTimeline.tsx` renders phases as colored bars with month markers, today indicator, and trophy pins for milestones.
- Coach mode: navigate with `?athlete=<userId>` to view/edit another athlete's plan.

## Per-Exercise Coach Feedback (`workout_log_feedback`)
- One feedback row per (coach, workout_log) — coaches leave a `reaction` (thumbs_up/fire/check_form/redo) plus optional comment (≤280 chars).
- `useExerciseFeedback.ts` provides upsert/delete/list helpers; `mark_workout_feedback_read` RPC marks read.
- `ExerciseFeedbackPanel` (coach editor) and `ExerciseFeedbackView` (athlete read-only) live in `src/components/coach/ExerciseFeedbackPanel.tsx`.
- Wired into `AIPlanCard` via `coachMode` + `athleteUserId` props. Athletes see pulsing badge until they tap to mark read.

## i18n
All strings translated across DA, EN, SV, DE, AR, NO. Phase labels resolved via `PHASE_META[type].labelKey` → `t(...)`.
