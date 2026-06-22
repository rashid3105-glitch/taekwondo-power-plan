## Goal

Coaches today see the athlete monthly mental assessment, which asks about competition anxiety, recovery from loss, fighter confidence, etc. Those questions don't fit a coach's reality. We build a parallel **Coach Mental Review** with categories, questions and AI advice tuned to coaching work — same monthly cadence, same offline-first plumbing, but separate data, separate UI entry and a different reminder.

## Coach categories (6, same 1–5 scale, ~3 questions each = 18 questions)

Designed around what actually drains or strengthens a coach:

1. **Coaching presence & focus** — staying patient and attentive across long sessions, not getting pulled into your phone, reading the room.
2. **Emotional regulation on the floor** — handling frustration when athletes underperform, staying calm under parent/club pressure, controlling tone after a bad result.
3. **Communication & feedback** — giving clear, constructive feedback; balancing critique vs encouragement; adapting tone to age/level.
4. **Pressure & expectations** — managing pressure from results, club leadership, parents, and your own ambition; sleep and overthinking after competitions.
5. **Coach confidence & identity** — belief in your methods, dealing with doubt after a loss, comparing yourself to other coaches.
6. **Coach motivation & burnout risk** — energy for training nights, joy in the job, boundaries between coaching and private life, signs of fatigue.

Each question follows the existing `MentalQuestion` shape (multiple choice 1–5 with localized labels in en/da/sv/de/ar/no/es) so we reuse the same rendering and scoring code.

## UX

- **Entry point**: on `/coach` dashboard, add a "Mental gennemgang" card in the same visual style as the existing reminder card. Shown to anyone with `activeRole === "coach"`. Card highlights when last coach assessment is >30 days old.
- **Route**: new page `/coach/mental` rendered by a new component `CoachMentalAssessment.tsx`. Same flow as athlete version: intro → questions → results (radar + per-category advice) → history list with regenerate + delete.
- **Bottom nav**: unchanged. Entry stays in coach dashboard + a deep link from the reminder push.
- **No mixing**: athlete assessments are not shown in the coach view and vice versa. A user who is both athlete and coach gets two separate histories.

## Data

New table `coach_mental_assessments` (mirrors `mental_assessments`):

```
id uuid pk, user_id uuid → auth.users, created_at timestamptz,
total_score int, scores jsonb, answers jsonb,
ai_advice jsonb, language text
```

- RLS: user can select/insert/update/delete own rows; service_role full; no anon.
- GRANTs to `authenticated` and `service_role` per project rules.
- No coach/athlete linkage — purely self-reflection, private to the coach.

## AI advice

New edge function `generate-coach-mental-advice` (clone of `generate-mental-advice`) with a coach-specific system prompt:

- Persona: experienced taekwondo head coach + sport psychologist.
- Output shape kept identical (`summary`, `strengths`, `improvementAreas[]`, `preCompetitionRoutine` renamed to `preTrainingRoutine` — a 10-min pre-session centering routine, and `affirmations`).
- Techniques framed around coaching: pre-session breathing, sideline reset cues, post-competition debrief journaling, parent-conversation scripts, delegating tasks to avoid burnout, weekly reflection ritual.
- Same 10 KB body cap, same answer validation, same Lovable AI Gateway (`google/gemini-2.5-flash`), same multi-language support (incl. no/es).

## Offline-first

Reuse the existing pattern from `mentalAssessmentOfflineDB.ts` / `mentalAssessmentSyncEngine.ts` / `useOfflineMentalAssessments.ts`:

- New `coachMentalAssessmentOfflineDB.ts` with `assessments` + `outbox` stores scoped to coach table.
- New `coachMentalAssessmentSyncEngine.ts` calling `generate-coach-mental-advice` then inserting into `coach_mental_assessments`.
- New `useOfflineCoachMentalAssessments.ts` hook.

## Reminder

- Clone `send-mental-reminder` → `send-coach-mental-reminder`. Selects approved profiles where `user_roles` contains `coach` and no coach assessment in 30 days, sends push: title "Månedlig mental gennemgang for trænere", url `/coach/mental`.
- pg_cron entry on the 1st of each month (migration).
- Athletes who are not coaches receive only the existing athlete reminder; coaches who are also athletes get both.

## i18n

Add a `translations` map inside `CoachMentalAssessment.tsx` (mirroring the athlete component) covering all 7 locales: en, da, sv, de, ar, no, es. New strings: page title, category names, intro/outro copy, reminder card, push body. Question option labels live in the new questions file with all 7 locales. No English fallback.

## Files

New:
- `src/data/coachMentalQuestions.ts`
- `src/components/CoachMentalAssessment.tsx`
- `src/pages/CoachMentalReview.tsx` (thin route wrapper)
- `src/lib/coachMentalAssessmentOfflineDB.ts`
- `src/lib/coachMentalAssessmentSyncEngine.ts`
- `src/hooks/useOfflineCoachMentalAssessments.ts`
- `supabase/functions/generate-coach-mental-advice/index.ts`
- `supabase/functions/send-coach-mental-reminder/index.ts`
- Migration: `coach_mental_assessments` table + RLS + GRANTs + pg_cron schedule.

Edited:
- `src/App.tsx` — add `/coach/mental` route.
- `src/components/hub/CoachDashboard.tsx` — add reminder/entry card.
- `src/i18n/translations.ts` — add coach mental keys (7 locales).
- `src/pages/Help.tsx` — changelog entry.
- Memory: new `mem://features/coach-mental-review.md` + index reference.

## Open questions before I build

1. **Frequency**: keep monthly (same as athletes) or quarterly for coaches? Coaches generally reflect less often — happy with monthly default but easy to change.
2. **Coach diary tie-in**: athletes can save the assessment summary into their diary. Coaches don't have a diary today — should the coach assessment summary just live in the history list, or do we also create a lightweight coach reflection note?
3. **Question count**: 18 (6 × 3) keeps it under 3 minutes. OK or want 24 (6 × 4) for more depth?
