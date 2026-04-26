## Goal
Make the mental assessment view easy to find by giving the athlete detail page a tabbed structure with **Mental** as its own dedicated tab.

## Why
Right now `CoachAthleteDetail.tsx` is one long scroll (~520 lines) with profile, schedule, goals, training plan, rehab, match analysis, season, mental, notes, comparison, reminders, physical testing — all stacked. The `<CoachAthleteMental />` block lives at line 508, well below the fold, so coaches scroll past it and miss it. A tabbed layout fixes findability and also tames the page.

## Proposed structure
Add a `Tabs` component near the top of `CoachAthleteDetail.tsx` (after the header / profile summary) with these tabs:

1. **Profile & Plan** — profile fields, weekly schedule, training goals, program length, training plan, rehab plan
2. **Mental** — `<CoachAthleteMental />` (now prominent, full-width)
3. **Performance** — Form curve, Physical Testing (coach mode), `PhysicalTestComparison`
4. **Activity** — Match Analysis entry, Season planner entry, Reminder History, Coach Notes

Tab order is chosen so coaches land on Profile & Plan (most common task), with Mental one tap away.

## Files to edit
- `src/components/CoachAthleteDetail.tsx`
  - Import `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`
  - Wrap the existing content blocks in the four tabs above
  - Keep the header (avatar, display name, athlete code, action buttons) above the tabs so it persists
  - Preserve all existing logic, state, and props — only the JSX layout changes

- `src/i18n/translations.ts`
  - Add 4 keys (×5 languages = 20 strings):
    - `tabProfilePlan` ("Profile & Plan" / "Profil & Plan" / "Profil & Plan" / "Profil & Plan" / "الملف والخطة")
    - `tabMental` ("Mental" — same in DA/SV/DE, "ذهني" in AR)
    - `tabPerformance` ("Performance" / "Performance" / "Performance" / "Leistung" / "الأداء")
    - `tabActivity` ("Activity" / "Aktivitet" / "Aktivitet" / "Aktivität" / "النشاط")

- `src/pages/Help.tsx`
  - Add Changelog entry 83: "Coach athlete detail reorganized into tabs (Profile & Plan, Mental, Performance, Activity) to surface mental assessments and reduce scrolling."

## Out of scope
- No data model changes — RLS for `mental_assessments` is already in place from the previous step.
- No changes to `CoachAthleteMental.tsx` itself; it just moves into a tab.
- Squad-level overview is unchanged — this is purely the per-athlete detail view.

## Verification
- Open an athlete (e.g. Nikola or Daniela), confirm tabs render and Mental tab shows their assessment with score, radar, and AI advice.
- Confirm Profile & Plan tab still saves schedule, generates plans, etc.
- Confirm tab labels render in all 5 languages.