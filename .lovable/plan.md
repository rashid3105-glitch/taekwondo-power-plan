

## Plan: Fix Mental Assessment for All Languages

### Problem
The Mental Assessment component crashes (black screen) because translations only exist for English and Danish. When Arabic, Swedish, or German is selected, `t[locale]` returns `undefined`, causing a runtime error.

### Changes

#### 1. `src/components/MentalAssessment.tsx`
- Add `sv`, `de`, and `ar` translation objects to the `t` dictionary (lines 80-141)
- Add `sv`, `de`, `ar` entries to `categoryLabels` (lines 46-53)
- Update `getOverallLabel()` to handle all 5 languages (lines 368-379)
- Change `const l = locale as "en" | "da"` to support all locales with fallback to `en`

#### 2. `src/data/mentalQuestions.ts`
- Extend the `text` and `options.label` types from `{ en; da }` to include `sv`, `de`, `ar`
- Add Swedish, German, and Arabic translations for all questions (both adult and junior sets)

#### 3. `src/components/MentalRadarChart.tsx`
- No changes needed — it receives labels as props from the parent

### Scope
- ~20 UI strings in `MentalAssessment.tsx` × 3 new languages
- ~18 questions × 5 options each × 3 new languages in `mentalQuestions.ts`
- 6 category labels × 3 new languages

