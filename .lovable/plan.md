## Why a separate instrument (not just reusing `mental_assessments`)

The existing **mental performance assessment** is a baseline readiness tool — 24+ Likert-scale questions across 6 generic categories (Mental Toughness, Competition Anxiety, Focus, Recovery from Loss, Confidence, Motivation). It's designed to be done periodically to track *trait-level* development.

A **post-competition reflection** is a different instrument:
- It's tied to a **specific event** (date, opponent, result)
- It mixes **quick performance ratings** with **qualitative reflection** (what went well / what didn't / why)
- It outputs **concrete, time-bound goals** for the next competition — not generic advice
- It only makes sense in the **48-hour window after the event** when emotions and details are still fresh

Trying to overload the existing tool would dilute both. The two instruments will instead **cross-reference each other**: the post-comp reflection will surface the athlete's most recent baseline scores as context, and the next baseline assessment will show recent reflections in the coach's view.

---

## 1. Data model — new table `competition_reflections`

```sql
create table public.competition_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  competition_id uuid references competitions(id) on delete set null,
  -- snapshot of competition for orphan-safety
  competition_name text,
  competition_date date,
  result text,              -- e.g. "Bronze", "Lost R16", "DNF"
  -- quick ratings (1–5 each)
  ratings jsonb not null default '{}',
  -- e.g. {
  --   overallPerformance, mentalReadiness, focusDuringMatches,
  --   emotionalControl, tacticalExecution, physicalCondition,
  --   recoveryBetweenMatches
  -- }
  -- guided reflection answers (free text, capped per field)
  reflections jsonb not null default '{}',
  -- e.g. { wentWell, didntGoWell, biggestLearning,
  --        whatIdDoDifferently, mentalTriggers }
  -- AI-generated next-comp action plan
  ai_plan jsonb,
  -- e.g. { summary, strengths[], focusAreas[],
  --        nextCompetitionGoals: [{ goal, why, how, metric }],
  --        suggestedDrills[], mentalRoutineUpdates[] }
  next_competition_id uuid references competitions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_comp_reflections_user_date
  on competition_reflections(user_id, competition_date desc);
```

**RLS** (mirrors `mental_assessments`):
- Users full CRUD on own rows
- Coaches `SELECT` for managed athletes (`coach_athletes`) **and** club members (`has_role + users_share_club`)
- Trigger: `update_updated_at_column` on UPDATE

**No CHECK on dates** — use a validation trigger if needed (per memory `mental-assessment-offline` precedent).

---

## 2. Edge function — `generate-competition-reflection`

Mirrors `generate-mental-advice` pattern (Lovable AI Gateway, `google/gemini-2.5-flash`, 10 KB body limit, locale-aware, no English fallback).

**Input**: `{ reflection_id, ratings, reflections, competition: {name, result, date}, recentBaselineScores?, profile, language }`

**Output JSON schema** (returned via tool calling for reliability):
```ts
{
  summary: string,                 // 2-3 sentences, empathetic + analytical
  strengths: string[],             // 2-4 items pulled from high ratings + "wentWell"
  focusAreas: [{                   // 2-3 items pulled from low ratings + "didntGoWell"
    area: string,
    why: string,
    suggestedDrills: string[]      // 2-3 from existing TKD/mental library vocab
  }],
  nextCompetitionGoals: [{         // EXACTLY 3 SMART goals
    goal: string,
    why: string,
    how: string,
    metric: string                 // observable success criterion
  }],
  mentalRoutineUpdates: string[],  // tweaks to pre-comp routine
  recommendedAssessment: boolean   // true if low ratings suggest re-doing baseline
}
```

System prompt anchors: TKD-specific language, sport-psych framing, no AI jargon, output in `language`. Validates payload size and per-field length before calling the gateway.

---

## 3. UX flow

### A. Trigger points
1. **Competitions page** — past competitions (currently filtered out; we'll add a "Past competitions" section ordered by date desc, limited to last 10) get a primary CTA: **"Reflect on this competition"** if no reflection exists, or **"View reflection"** if one does.
2. **Auto-prompt** — when the user opens the dashboard within 48h of a competition's `event_date`, show a one-time toast/banner: *"How did [Comp name] go? Take 3 minutes to reflect →"*. Dismissible; remembered via `localStorage` per competition_id.
3. **Mental tab on dashboard** — new card "Post-competition reflections" listing recent ones with chevron to the detail.

### B. The reflection screen (new component `PostCompetitionReflection.tsx`)

Mobile-first, 4 short steps with progress bar (matches existing `MentalAssessment` styling):

**Step 1 — Result snapshot**
- Confirm/edit competition name, date, result (placement / matches won-lost)
- Big emoji-style mood selector (1–5: Devastated → Elated)

**Step 2 — Quick ratings** (7 sliders, 1–5, with verbal anchors)
- Overall performance · Mental readiness · Focus during matches · Emotional control · Tactical execution · Physical condition · Recovery between matches

**Step 3 — Guided reflection** (5 free-text prompts, 280 chars each)
- What went well? · What didn't go as planned? · Biggest lesson · What I'd do differently · Mental triggers I noticed (nerves, distractions, anchors that worked)

**Step 4 — Generate plan**
- Spinner → renders `ai_plan` in a clean card layout:
  - Summary, Strengths chips, Focus areas (each expandable), **3 SMART goals for next competition**, Mental routine updates
  - "Link to next competition" select (lists upcoming comps); writes `next_competition_id`
  - Buttons: **Save to diary** (creates a diary entry tagged `competition-reflection`), **Export PDF** (reuses existing PDF export pattern from mental assessment)

### C. Offline-first (consistent with `mental-assessment-offline` memory)
- New `src/lib/competitionReflectionOfflineDB.ts` (IndexedDB: `reflections` + `outbox`)
- New `src/lib/competitionReflectionSyncEngine.ts` — on reconnect: insert row, then call `generate-competition-reflection`, store `ai_plan`
- New `src/hooks/useOfflineCompetitionReflections.ts` — `submitOffline`, `regeneratePlan`, `removeReflection`, `refresh`
- Pending badge + "Plan will be generated when you reconnect" card

---

## 4. Coach view

Add a new section inside the existing **Mental tab** of `CoachAthleteDetail.tsx` (built last loop) titled **"Post-Competition Reflections"**:
- List of past reflections with date, comp name, overall rating dot, and chevron
- Tapping opens the same readonly card layout (ratings, reflections, AI plan, next-comp goals)
- New component `src/components/coach/CoachAthleteReflections.tsx` (parallels `CoachAthleteMental.tsx`)

---

## 5. Cross-references

- **Baseline assessment screen** — when an athlete has a reflection from the past 14 days, show a small chip *"Insights from your last competition →"* that links to it.
- **Competition detail card** — if a reflection exists, show a single line *"Reflection saved · 3 goals set for next competition"* under the result row.
- **Diary** — if "Save to diary" clicked, creates a diary entry with the summary + 3 goals so it surfaces in the standard timeline.

---

## 6. Localization

Add ~40 new keys to `src/i18n/translations.ts` across **en, da, sv, de, ar** (RTL-safe). Naming: `reflection*` prefix (e.g. `reflectionTitle`, `reflectionStepRatings`, `reflectionPromptWentWell`, `reflectionGenerating`, `reflectionGoals`, etc.). System prompt for the edge function instructs Gemini to produce JSON content in the user's `language` — no English fallback.

---

## 7. Documentation

- New memory file `mem://features/competition-reflection.md` — describes table, edge function, offline DB, UX flow, and coach surfacing.
- Update `mem://index.md` to reference it under "## Memories".
- Add **Changelog Entry 84** to `Help.tsx` and `translations.ts`.

---

## Files to create / edit

**New**
- `supabase/migrations/<timestamp>_competition_reflections.sql`
- `supabase/functions/generate-competition-reflection/index.ts`
- `src/lib/competitionReflectionOfflineDB.ts`
- `src/lib/competitionReflectionSyncEngine.ts`
- `src/hooks/useOfflineCompetitionReflections.ts`
- `src/components/PostCompetitionReflection.tsx`
- `src/components/coach/CoachAthleteReflections.tsx`
- `src/pages/CompetitionReflection.tsx` (route: `/competitions/:id/reflect`)
- `mem://features/competition-reflection.md`

**Edited**
- `src/App.tsx` — add the new route
- `src/pages/Competitions.tsx` — load past competitions section + reflect CTA
- `src/pages/Dashboard.tsx` — 48h post-comp banner
- `src/components/CoachAthleteDetail.tsx` — embed `CoachAthleteReflections` in Mental tab
- `src/components/MentalAssessment.tsx` — small chip linking to recent reflection
- `src/i18n/translations.ts` — ~40 new keys + changelog entry
- `src/pages/Help.tsx` — Changelog Entry 84
- `mem://index.md` — register the new memory file

---

## Optional follow-ups (not in this plan unless requested)

- Trend chart of ratings across reflections (parallels `FormCurveChart`)
- Coach-side ability to comment privately on a reflection (parallels `CoachNotes`)
- Auto-create a focused 1-week mini-plan addressing the top focus area (would call into `generate-plan` with overrides)

---

**Approve to implement** — or tell me to trim scope (e.g. skip offline support for v1, drop the auto-prompt banner, or ship without the coach view first).