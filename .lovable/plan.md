Allow coaches to log a single test session for **multiple athletes at once** (e.g. Cooper test ran with 8 athletes simultaneously). Today only the Beep Test supports group mode; this extends the same pattern to every test in the catalog.

Be sure it really makes sense to do the testing of multiple athletes in one test. 

## What changes

### 1. `src/components/PhysicalTesting.tsx` — multi-select athletes (coach mode)

- Replace the single-athlete `<Select>` with a multi-select list (checkbox list + "Select all / clear" actions). Reuse existing `athletes` loader.
- New state: `selectedAthleteIds: Set<string>` instead of `selectedAthleteId`.
- `targetUserId` becomes `targetUserIds: string[]`.
- Single-athlete views (Progression tab, results table) keep working by:
  - Progression tab: if exactly 1 athlete selected → show their progression; if multiple → small "pick one to view progression" sub-selector.
  - Results table: same — show the results of whichever athlete is "focused" (defaults to first selected); add a small chip row to switch focus.
- When `athleteId` is passed in as a prop (legacy single-athlete entry), behavior is unchanged.

### 2. `src/components/testing/TestRunner.tsx` — per-athlete value entry

- New optional prop: `athletes?: Array<{ id: string; name: string }>`.
- The timer / countdown / stopwatch widget runs **once** (shared for the whole group).
- At submission time:
  - If `athletes` is provided and length > 1 → render a list of inputs (one row per athlete) for the value. Stopwatch tests pre-fill all rows with the shared elapsed time (coach can adjust per athlete since not all athletes finish at the exact same moment); countdown/pure-input tests leave inputs blank.
  - If 0–1 athletes → current single-value behavior unchanged.
- `onSave` callback signature extended:
  - `onSave(result: { value: number; unit: string } | { entries: Array<{ athleteId: string; value: number }>; unit: string }): Promise<void>`
  - PhysicalTesting handles both shapes and inserts one `physical_test_results` row per entry.

### 3. `handleRunnerSave` in PhysicalTesting

- Iterate entries → call `addResult(...)` once per athlete with the right `user_id`.
- Show a toast like "Saved for N athletes".

### 4. Translations (`src/i18n/translations.ts`)

- `ptSelectAthletes` (plural), `ptSelectAll`, `ptClearSelection`, `ptResultsForGroup`, `ptSavedForN`, `ptPerAthleteResult`, `ptFocusAthlete` — added in all 7 languages.

### 5. Leave untouched

- `BeepTestTimer` already supports multi-athlete — no changes needed; just pass it the new selected athlete array (already does).
- Comparison tab (all-club ranking) is unaffected.
- DB schema unchanged — still one row per athlete in `physical_test_results`.

## UX summary

Coach flow:

1. Open `/library/testing` → "Testresultater" → coach mode.
2. Check off N athletes from the multi-select list.
3. Tap "Kør test" → pick e.g. Cooper Test.
4. Start the 12-min countdown — runs once for the group.
5. At the end: input each athlete's distance in a per-row list.
6. Save → N rows written, each tagged with `test_type = "coach"` and `tested_by = coach.id`.