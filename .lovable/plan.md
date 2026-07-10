# Team Testing Sessions

Coaches can build a multi-test session for a chosen squad, either by picking tests manually or by describing the focus (strength, agility, flexibility, explosiveness, endurance, speed, power) and letting the system suggest a battery from the existing test library. Sessions are saved, resumable, and can be reopened to compare across dates.

## User flow (coach)

1. On the coach Testing page, new "Team session" tab next to today's individual/coach view.
2. "New session" → wizard:
   - **Step 1 – Athletes**: pick a subset from the coach's club (search + select-all).
   - **Step 2 – Tests**:
     - Tab A: **AI-suggested** — coach ticks one or more focus areas (Strength, Agility, Flexibility, Explosiveness, Endurance, Speed, Power, Reaction, Balance), optional intensity (short/full battery) and a free-text note. System calls an edge function that returns 4–8 tests picked from `TEST_CATALOG`. Coach reviews, can add/remove tests, then continues.
     - Tab B: **Manual** — reuse `TestCatalogPicker` in multi-select mode.
   - **Step 3 – Name + entry mode**: session name (auto-suggested), date, and entry mode: *Guided station-by-station* or *Free entry grid*.
3. Session opens on the chosen entry screen. Coach can leave and resume anytime; it remains in "In progress" until they mark it complete.
4. Completed sessions list shows date, athlete count, tests, and a "Compare with previous" link.

## Entry modes

- **Guided**: reuses existing `TestRunner` group mode. Iterates through the session's tests one at a time; each test records values for every athlete before advancing. Progress bar shows "Test 2 of 5".
- **Grid**: matrix `athletes × tests` with inline numeric inputs; coach fills in any order. Stopwatch/countdown widgets available per cell via a small "Run" button that opens the same `TestRunner` for that one test.

Saving in either mode writes rows to `physical_test_results` as today (so all existing progression/comparison views keep working) **and** links each result to the session.

## AI suggestion

Edge function `suggest-test-battery`:
- Input: `{ focuses: TestCategory[], intensity: "short"|"full", notes?: string, locale }`
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured output listing `test_ids` chosen only from the provided catalog id list, plus a one-line rationale.
- Server validates every returned id against `TEST_CATALOG`; unknown ids dropped. Falls back to a deterministic pick (first N per focus) if AI returns nothing.

## Data model

New migration:

- `team_test_sessions`
  - `id uuid pk`, `club_id uuid`, `coach_id uuid`, `name text`, `session_date date`,
    `entry_mode text check in ('guided','grid')`, `focus_areas text[]`, `notes text`,
    `status text check in ('in_progress','completed')`, `created_at`, `updated_at`.
- `team_test_session_tests`
  - `id uuid pk`, `session_id uuid fk`, `test_id text` (catalog id), `test_name text` (dbTestName snapshot), `order_index int`.
- `team_test_session_athletes`
  - `session_id uuid`, `athlete_id uuid`, pk (session_id, athlete_id).
- `physical_test_results`: add nullable `session_id uuid` fk to `team_test_sessions`.

All new tables: `GRANT` to `authenticated` + `service_role`; RLS scoped by `club_id` (coach of that club can read/write; athletes can read sessions they're part of and their own results).

## Files

- New: `src/pages/CoachTestSession.tsx` (wizard + session run screen router).
- New: `src/components/testing/TeamSessionWizard.tsx` (3-step wizard).
- New: `src/components/testing/TeamSessionGuidedRun.tsx` (wraps existing `TestRunner`).
- New: `src/components/testing/TeamSessionGridRun.tsx`.
- New: `src/components/testing/TeamSessionsList.tsx` (list of past/in-progress sessions).
- New: `supabase/functions/suggest-test-battery/index.ts`.
- Edit: `src/components/PhysicalTesting.tsx` – add "Team sessions" sub-tab for coach mode linking to the new page.
- Edit: `src/hooks/useOfflinePhysicalTests.ts` – accept optional `session_id` on `addResult`.
- Edit: `src/lib/physicalTestOfflineDB.ts` + `physicalTestSyncEngine.ts` – carry `session_id` through queue.
- Edit: `src/i18n/translations.ts` – add keys for all 7 languages (wizard labels, focus names, entry mode labels, statuses).
- Edit: `src/pages/Help.tsx` – changelog + short docs entry.

## Out of scope (can be follow-ups)

- Cross-session comparison charts beyond a link to existing progression view.
- Offline-first for sessions themselves (results still queue offline; session metadata requires online).
- Exporting session as PDF.
