## Goal
Stop coaches (and any future shared-club SELECT) from being able to read administrative/billing fields on athlete profile rows. These fields are not needed for coaching.

## Fields being moved out of `public.profiles`
- `is_approved`
- `payment_status`
- `payment_date`
- `demo_full_access`
- `demo_expires_at`
- `rejection_reason`
- `pending_invite_code`
- `pending_coach_id`

`is_demo`, `club_id`, `phone`, `birth_date`, `weight_kg`, `gal_license` stay on `profiles` (coaching-relevant or already needed for shared club logic).

## Database migration
1. Create `public.profiles_sensitive` (PK = `user_id`, one row per profile, the 8 columns above + `created_at`/`updated_at`).
2. Backfill from `profiles`.
3. RLS:
   - Owner: SELECT own row.
   - Admin: SELECT / UPDATE / INSERT any row.
   - No coach access. No parent access. Edge functions use service role (bypasses RLS).
4. Trigger on `profiles` AFTER INSERT → seed `profiles_sensitive`.
5. Drop the 8 columns from `profiles`.
6. Update `handle_new_user` (signup trigger) to also insert into `profiles_sensitive`.
7. Update `get_profile_protected_fields`, `admin_approve_with_invite`, `admin_reject_with_reason`, `apply_invite_to_my_profile`, `accept_parent_invite` (if it touches `is_approved`) to read/write `profiles_sensitive`.
8. Update `profiles` UPDATE policies to drop the now-irrelevant column-equality clauses that referenced the moved fields.

## Code updates (~21 files)
- **Edge functions** (use service role, just swap table name in queries):
  - `update-my-profile`, `create-athlete`, `check-subscription`, `parent-signup`, `bootstrap-coach-trial`, `cleanup-demo-users`, `recompute-form-curve`, `notify-coaches-athlete-activity`, `dispatch-scheduled-pushes`, `_shared/checkEntitlement.ts`
- **Client** (read own row from `profiles_sensitive`, or admin reads from there):
  - `Dashboard.tsx`, `PendingApproval.tsx`, `ProfileSetup.tsx`, `Onboarding.tsx`, `Auth.tsx`, `Pricing.tsx`, `AdminApproval.tsx`, `AdminPayments.tsx`, `useEntitlements.ts`, `coach/PendingAthletesSection.tsx`
- `src/integrations/supabase/types.ts` regenerates automatically.

## Verification
- Typecheck.
- Smoke-test: signup creates both rows, owner reads own status, admin approval flow still works, coach view does not expose the dropped columns (they no longer exist on the row).

## Risk
Medium-high — touches the signup/approval/payment paths. Mitigation: keep the migration backward-permissive (don't drop columns on profiles until step 5, run in a single transaction with backfill, so a failure rolls back).

Approve and I'll execute the migration then update each file.
