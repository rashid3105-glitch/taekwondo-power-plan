## Goal
Replace the wide "Create athlete (X/Y)" button in the Coach Dashboard header with a compact **icon button** that opens a **centered modal dialog** containing the same create form. This frees up horizontal space — especially important on mobile (402px viewport) where the button currently wraps next to "Weekly export".

## Where it shows up today
`src/pages/CoachDashboard.tsx` (lines 314–321) renders `<CreateAthleteSheet>` next to `<WeeklySquadExport>` in the tab-bar row. The trigger inside `CreateAthleteSheet` is a full `Button` with `<Plus />` icon + `t("addAthleteAction")` text + an inline `countLabel` (`"3/5"`).

The form itself currently lives in a right-side `<Sheet>`, which is fine on desktop but feels heavy for a quick action on mobile.

## Proposed changes

### 1. `src/components/coach/CreateAthleteSheet.tsx` — convert to icon + modal
- Rename the file to `CreateAthleteDialog.tsx` (and the exported component to `CreateAthleteDialog`) for clarity.
- Replace `Sheet` / `SheetContent` / `SheetHeader` / `SheetTitle` / `SheetDescription` / `SheetTrigger` with `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogTrigger` from `@/components/ui/dialog`.
- Trigger becomes an **icon-only button**:
  - `<Button size="icon" variant="default" aria-label={t("addAthleteAction")} title={`${t("addAthleteAction")}${countLabel ? " · " + countLabel : ""}`}>` with a `<UserPlus className="h-4 w-4" />` icon (more meaningful than a generic plus).
  - Disabled state preserved (`disabled={!isAdmin && athletes.length >= MAX_ATHLETES}`); when disabled, tooltip/title surfaces the limit.
- `DialogContent` uses `className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto"` so the form scrolls inside the modal on small screens.
- Move the `countLabel` (e.g. `"3/5"`) from the trigger into the modal header as a small muted badge next to the title, so the info is preserved but no longer takes header space.
- All existing form behavior is unchanged: "Add by code" block, divider, "Create new" form, validation, `create-athlete` Edge Function call, `lookup_athlete_by_code` RPC, success toasts, `onCreated()` callback, reset on close.

### 2. `src/pages/CoachDashboard.tsx` — wire up renamed component
- Update the import on line 28 to `import { CreateAthleteDialog } from "@/components/coach/CreateAthleteDialog";`.
- Replace `<CreateAthleteSheet ... />` on line 316 with `<CreateAthleteDialog ... />` (same props: `disabled`, `onCreated`, `countLabel`).
- The surrounding `<div className="flex items-center gap-2">` then naturally collapses to `[Weekly export][+ icon]`, leaving room for the Tabs row beside it on mobile.

### 3. No new translation keys
Reuses existing keys: `addAthleteAction`, `createAthlete`, `createAthleteDesc`, `orAddByCode`, etc. The icon button uses `addAthleteAction` as its `aria-label` for screen readers.

### 4. No backend or DB changes
No migrations, no RLS changes, no Edge Function changes. The `create-athlete` function and `coach_athletes` insert path remain identical.

## Out of scope (not touched in this plan)
- Pre-existing Edge Function build errors (`zod@3.23.8`, `@supabase/supabase-js@2.57.2` resolution, `coach-weekly-digest.tsx` `<Preview>` type). These were present before this change and are unrelated to the UI cleanup. Happy to clean them up in a separate pass if you'd like — just say the word.

## Files touched
- **Renamed/rewritten**: `src/components/coach/CreateAthleteSheet.tsx` → `src/components/coach/CreateAthleteDialog.tsx`
- **Edited**: `src/pages/CoachDashboard.tsx` (import + JSX tag)

## Result
On the 402px viewport you're using, the coach dashboard header row becomes:
`[Squad | Today | Messages]   [📅 export] [👤+ icon]`
…instead of the current wrapped two-row layout.
