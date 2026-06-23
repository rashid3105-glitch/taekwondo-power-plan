## Goal
Match the icon styling used in **Fysisk tests** (`TestCatalogPicker.tsx`) inside **Øvelser** (`ExerciseLibrary.tsx` + `ExerciseCard.tsx`).

Currently Øvelser uses thin Lucide icons in `text-primary` on category headers and a tiny colored dot on each exercise row. Fysisk tests uses a **colored tile (`bg-{color}-500/15`) with a matching `text-{color}-500` icon** rendered in a 40×40 (header) / smaller (row) rounded square.

## Color + icon mapping (mirrors Fysisk tests palette)
| Exercise category | Icon (Lucide)   | Tile bg                | Icon color         |
|-------------------|-----------------|------------------------|--------------------|
| power             | `Zap`           | `bg-yellow-500/15`     | `text-yellow-500`  |
| plyometric        | `Flame`         | `bg-orange-500/15`     | `text-orange-500`  |
| speed             | `Gauge`         | `bg-amber-500/15`      | `text-amber-500`   |
| strength          | `Dumbbell`      | `bg-sky-500/15`        | `text-sky-500`     |
| mobility          | `StretchHorizontal` | `bg-cyan-500/15`   | `text-cyan-500`    |
| custom            | `Plus`          | `bg-violet-500/15`     | `text-violet-500`  |

(Reuses the same color tokens as `CAT_STYLE` in `TestCatalogPicker` so the two libraries look like siblings.)

## Changes

### 1. `src/components/ExerciseLibrary.tsx`
- Replace `CATEGORY_ICONS` with a `CATEGORY_STYLE` map containing `{ Icon, tile, icon }` per category (plus `custom`).
- Update the `CollapsibleTrigger` row so the icon is rendered inside a `h-10 w-10 rounded-xl` tile with the category background, matching the Fysisk tests header layout (icon + bold label + count badge + chevron). Keep `defaultOpen={false}` behavior.
- Swap `ChevronDown` rotation for the same `ChevronRight`/rotate pattern used in `TestCatalogPicker` to keep visual parity (optional polish — keep current ChevronDown if simpler).

### 2. `src/components/ExerciseCard.tsx`
- Replace the small `CATEGORY_DOT` span (`h-2 w-2 rounded-full`) with a small colored tile `h-7 w-7 rounded-lg` containing the matching Lucide icon — same color tokens as the header but smaller, so each exercise row carries its category visually.
- Remove the old `CATEGORY_DOT` constant.
- Export the shared style map from `ExerciseLibrary.tsx` (or move it to a small new file `src/lib/exerciseCategoryStyle.ts`) so both files share one source of truth. Recommended: new file `src/lib/exerciseCategoryStyle.ts` exporting `EXERCISE_CATEGORY_STYLE`.

### 3. No changes to
- `src/data/exercises.ts` data
- `exerciseClassification.ts` risk styles
- Translation keys
- YouTube icon button (kept as-is)

## Out of scope
- No data, filter logic, or translation changes.
- Risk badge and goal badges stay unchanged.

## Acceptance
- Category headers in Øvelser show the same colored-tile + icon look as in Fysisk tests.
- Each exercise row shows a small matching colored-tile icon instead of the dot.
- Dark/light mode both render correctly (uses Tailwind `/15` opacity tiles, identical to PhysicalTesting which already works in both modes).
