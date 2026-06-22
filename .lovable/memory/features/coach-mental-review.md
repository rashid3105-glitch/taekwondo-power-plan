---
name: coach-mental-review
description: Coach-specific monthly mental review with its own categories, questions, table, AI advice and dashboard entry — separate from the athlete monthly mental assessment
type: feature
---
Coaches have a separate monthly mental review reachable from `/coach/mental` (linked from a card on the coach dashboard, right after the team weekly schedule + activity types cards).

Scope:
- 6 categories × 3 questions = 18 items: coachingPresence, emotionalRegulation, communicationFeedback, pressureExpectations, coachConfidence, coachMotivation. Same 1–5 scale and average-per-category scoring as the athlete `MentalAssessment`.
- Questions, category labels and UI strings cover en/da/sv/de/ar/no (same 6 locales the athlete component supports).
- Coach context only — never share/show alongside the athlete `mental_assessments` table.

Data:
- Table `public.coach_mental_assessments` (id, user_id → auth.users, total_score, scores jsonb, answers jsonb, ai_advice text JSON, language, created_at). RLS: owner-only SELECT/INSERT/UPDATE/DELETE; service_role full.
- `ai_advice` stored as JSON string; hook's `parseAdvice` normalises it back to object/null.

AI advice:
- Edge function `generate-coach-mental-advice` (clone of `generate-mental-advice`). System prompt explicitly addresses the COACH (not an athlete) and frames techniques around sideline reset cues, parent-conversation scripts, post-session debrief, boundary setting, burnout prevention.
- `preCompetitionRoutine` field is repurposed as a 10-minute centering routine for the coach before stepping on the mat.

Offline:
- IndexedDB `coach-mental-assessment-offline` with `assessments` + `outbox` stores (`src/lib/coachMentalAssessmentOfflineDB.ts`).
- Sync engine `src/lib/coachMentalAssessmentSyncEngine.ts` calls `generate-coach-mental-advice` then inserts into `coach_mental_assessments`.
- Hook `src/hooks/useOfflineCoachMentalAssessments.ts`. Auto-syncs on `online` event.

Files:
- `src/data/coachMentalQuestions.ts`
- `src/components/CoachMentalAssessment.tsx` (intro / quiz / results / history; results show summary, strengths, improvementAreas, preCompetitionRoutine, affirmations; history supports view, delete with confirm, regenerate advice)
- `src/pages/CoachMentalReview.tsx` route wrapper, RTL aware
- Route registered in `src/App.tsx` as `/coach/mental`
- Entry card added in `src/pages/CoachDashboard.tsx` after `ClubActivityTypesCard`

Not done yet (open to add later if requested):
- Dedicated push reminder/cron for coaches (athlete `send-mental-reminder` is unchanged).
- "No advice yet" regenerate button currently only shows when viewing a past entry without advice.
- supabase types.ts isn't auto-regenerated for the new table yet, so the hook uses `from("coach_mental_assessments" as any)` casts — they can be removed once types regenerate.
