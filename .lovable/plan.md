## Add Self-training as a new session type

Introduce `selftraining` (DA: "Selvtræning") alongside `tkd`, `gym`, `rest`, `styrke`, `stævne`. Icon: lucide `User`, color: amber/orange (semantic token).

### 1. Design token
- Add `--self` (amber, e.g. `38 92% 50%`) + `--self-foreground` in `src/index.css` (light + dark), wire into `tailwind.config.ts` as `colors.self`.

### 2. Type + helpers — `src/lib/seasonCalendar.ts`
- Extend `SessionType` union with `"selftraining"`.
- Add to `SESSION_TYPES` array.
- `sessionRowClass` → `bg-self/10`.
- `sessionLabelKey` → `"sessionTypeSelftraining"`.
- `sessionDotColor` → amber hex (`#f59e0b`).

### 3. WeekSchedulePicker — `src/components/WeekSchedulePicker.tsx`
- Add `selftraining` entry to `TYPES` array with `User` icon, `text-self`, `border-self/50`, `bg-self/10`.
- Update `SessionType` union and cycle order: `tkd → gym → selftraining → rest`.
- Add legend chip.

### 4. planSessionUtils — `src/lib/planSessionUtils.ts`
- Extend `type` union with `"selftraining"`.
- Multi-session fallback icon logic unchanged.

### 5. Translations — `src/i18n/translations.ts`
- Add `sessionTypeSelftraining` for all 7 locales (en, da, sv, de, ar, no, es):
  - da: "Selvtræning", en: "Self-training", sv: "Egenträning", de: "Eigentraining", no: "Egentrening", es: "Autoentrenamiento", ar: "تدريب ذاتي".

### 6. Consumer components — render new type with icon/color
Update render switches/maps in:
- `src/components/hub/SeasonCalendarView.tsx`
- `src/pages/SeasonCalendar.tsx`
- `src/components/coach/TeamWeeklyScheduleCard.tsx` (already uses WeekSchedulePicker — no change needed beyond picker)
- `src/components/coach/WeeklySquadExport.tsx`
- `src/components/DayDetail.tsx`
- `src/components/CoachAthleteDetail.tsx`
- `src/components/today/TodayCard.tsx`
- `src/components/SampleProgramDialog.tsx`
- `src/components/landing/SamplePlanPreview.tsx`

For each: where `tkd|gym|rest|styrke|stævne` maps to icon/label/color, add the `selftraining` branch.

### 7. Edge functions — `supabase/functions/generate-plan/index.ts` + `generate-weekly-athlete-summary/index.ts` + `update-my-profile/index.ts`
- Treat `selftraining` as a valid value where session types are validated/used.
- In `generate-plan`, prompt: instruct AI to produce a lower-volume self-guided session (athlete trains alone, no coach) — same exercise structure as a TKD/gym day but lighter, with cues/notes.

### 8. Database
No migration needed — `session_type` is a free-text column with no CHECK constraint. Existing rows unaffected.

### Files touched (~14)
`src/index.css`, `tailwind.config.ts`, `src/lib/seasonCalendar.ts`, `src/lib/planSessionUtils.ts`, `src/components/WeekSchedulePicker.tsx`, `src/i18n/translations.ts`, the 9 consumer components above, and 3 edge functions.

### Out of scope
- Backfilling existing user schedules.
- New "self-training" exercise library (reuses existing exercises).
- Coach analytics breakdown by type (existing groupings will pick it up automatically once rendered).
