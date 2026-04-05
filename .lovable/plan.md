

## Plan: Allow athletes to delete training plans and generate new ones

Currently, athletes without a coach can generate plans and reactivate old ones, but cannot delete them. Athletes with a coach see the plan as read-only with no generate button. The fix unlocks paid athletes (same pattern as nutrition) and adds delete functionality.

### Changes

**1. Add delete button for training plans** (`src/pages/Dashboard.tsx`)

- Add a delete button next to each previous (inactive) plan in the "Previous Plans" list (lines 688-706). Include a confirmation dialog (AlertDialog) before deleting.
- Add a delete option for the active plan as well -- either a small trash icon in the profile summary bar or below the active plan card. Deleting the active plan removes it and shows the empty state.
- Delete via `supabase.from("training_plans").delete().eq("id", plan.id)` then `loadData()`.
- Show delete for athletes who own the plan (`!hasCoach || isPaid`), matching the same logic used for nutrition.

**2. Allow paid athletes with a coach to generate new plans** (`src/pages/Dashboard.tsx`)

- Change the generate button condition from `!hasCoach` (line 657) to `!hasCoach || isPaid`, so paid athletes can generate their own plans even when coached.
- Same logic for the "Activate" button on previous plans (line 694).

**3. Import AlertDialog components** (`src/pages/Dashboard.tsx`)

- Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` and `Trash2` icon.

### Summary of access rules

| Action | No coach | Has coach (unpaid) | Has coach (paid) |
|--------|----------|-------------------|-----------------|
| Generate plan | Yes | No | Yes |
| Activate old plan | Yes | No | Yes |
| Delete plan | Yes | No | Yes |

