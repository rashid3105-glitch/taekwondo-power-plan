

## Plan: Localize Exercise (and other library) Names

### Problem found

Looking at `src/data/exercises.ts`, the `Exercise` data structure has localized `notes`, `whyItMatters`, and `alternatives` for `en/da/sv` only — but **the exercise `name` itself has only ONE value**, stored once at the top level (e.g. `name: "Trap Bar Deadlift"`, `name: "Box Jumps (Step Down)"`, `name: "Hang Clean Pull"`).

So no matter what language the user picks, the names always render in **English**, while the surrounding UI (filters, headers, day labels, "Why it matters") is translated. That's the "mixed up" you're seeing.

Same issue affects:
- **Alternative exercise names** inside each locale block — e.g. Danish has `"Eksplosivt Længdespring"` but Swedish has the proper Swedish version, while the parent exercise name above is still English. Inconsistent.
- **`resolveExercise`** (line 1365) hard-falls back to English for `sv`, `de`, `ar`, `no` — so Swedish/German/Arabic/Norwegian users see fully English notes + alternatives too, even though Swedish translations already exist in the file. This is a separate bug.
- **Day labels** in `getWeeklyPlan` have no Norwegian or Arabic branch — falls through to English.
- **Recipes** (`src/data/recipes.ts`) have only `en` + `da` localized names.
- **Physical tests** (`STANDARD_TESTS` in `PhysicalTesting.tsx`) are hardcoded English strings.
- **Mental exercises** ARE properly localized for all 6 languages already — no fix needed.

### Fix

**1. Add localized `name` to every exercise (and clean up alternatives)**

Move `name` from the top-level `ExerciseBase` into each locale block. Extend `ExerciseLocalized` to:
```ts
interface ExerciseLocalized {
  name: string;
  notes: string;
  whyItMatters: string;
  alternatives?: { name: string; reason: string }[];
}
```

Add `de`, `ar`, `no` locale blocks (currently only `en/da/sv` exist) for all ~30 exercises, including localized:
- main exercise name
- notes
- whyItMatters
- alternatives (name + reason)

**2. Fix `resolveExercise` fallback chain**

Replace the brittle "everything not en/da becomes en" with proper per-locale lookup that falls back gracefully: `base[locale] ?? base.en`.

**3. Localize weekly-plan day labels and focus strings**

Extend `getWeeklyPlan` with `de`, `ar`, `no` branches for day names, labels, and focus text (currently only en/da/sv/de — `no` and `ar` missing).

**4. Localize recipe names**

Add `sv`, `de`, `ar`, `no` blocks to every recipe in `src/data/recipes.ts` (name, ingredients, steps).

**5. Localize physical test names**

Replace `STANDARD_TESTS` hardcoded English with a `Record<Locale, …>` lookup, or use translation keys via `t()`. Same approach for unit labels ("sec", "kg", "reps", "level", "m", "bpm") which are already universal abbreviations and can stay.

### Approach

Programmatic, locale-by-locale. I'll build a translation table per exercise (DA already exists for notes/why, so I'll derive `de/ar/no` from the EN canonical and use existing DA/SV as references for tone). Norwegian Bokmål will use the same Danish→Bokmål substitution rules we just applied to `translations.ts`.

For physical tests I'll wire each test's `name` to a `TranslationKey` and add the strings to `src/i18n/translations.ts`.

### Files modified

- `src/data/exercises.ts` — restructure `ExerciseBase`, add `name` to localized blocks, add `de/ar/no` blocks to all ~30 exercises, fix `resolveExercise` fallback, extend `getWeeklyPlan` for `no` and `ar`
- `src/data/recipes.ts` — add `sv/de/ar/no` localized blocks for every recipe
- `src/components/PhysicalTesting.tsx` & `src/components/TestLibrary.tsx` — replace hardcoded English test names with `t()` lookups
- `src/i18n/translations.ts` — add ~13 physical-test name keys × 6 languages

### Caveats

- This is a large data-entry pass (~30 exercises × 3 new languages × 4 fields ≈ 360 strings, plus recipes and tests). I'll keep technical TKD terminology (poomsae, naeryo chagi, dollyo, etc.) untranslated as they're proper Korean nouns.
- Exercise names that are universal English gym terms ("Trap Bar Deadlift", "Box Jumps", "Bulgarian Split Squat") will get sensible localized forms where natural (e.g. DE: "Bulgarische Ausfallschritte") but kept in English where the English term is the universally-used name in that locale's gym culture (e.g. "Box Jumps" stays "Box Jumps" in DE/SV — that's how gyms there speak).
- After the change, `WEEKLY_PLAN` (the eager EN export at line 1435) stays for backward compat.

