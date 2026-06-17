Make the "Testresultater" view the primary `/library/testing` page and remove the old test-catalog list + modal trigger.

## Changes

**`src/components/TestLibrary.tsx`**
- Drop everything: the "Testresultater" button, the expand/collapse test-catalog list, and the `Dialog` wrapper.
- New body is just `<PhysicalTesting mode={hasCoachRole ? "coach" : "individual"} />`.
- Keep the file (still imported from `Library.tsx`) and keep the `getLocalizedTestName` re-export.

**Nothing else changes.** `Library.tsx` keeps routing `testing` → `TestLibrary`. `PhysicalTesting` already renders the collapsed category list with colored icons, the "Start test / Resultater" tab, Progression, Sammenlign atleter, and the results history below.

## Result

Visiting `/library/testing` lands directly on the tabbed page from your screenshot — no modal, no duplicate catalog above it, no extra button.

## Out of scope
- No changes to `PhysicalTesting`, `TestCatalogPicker`, translations, or routing.
- The YouTube link + protocol details that lived in the old catalog list are removed (they aren't in the new view). Say so now if you want them preserved somewhere.
