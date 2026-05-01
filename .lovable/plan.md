# Require admin approval for coach-created athletes

## Goal
Coaches can still create athlete accounts, but the athletes cannot use the system until an admin approves them — same gate that already exists for self-signups.

## Current behavior
- Coach uses **Add athlete** dialog → calls the `create-athlete` edge function.
- That function sets `is_approved: true` on the new profile, so the athlete can log straight in and use everything.
- Self-signups, by contrast, are created with `is_approved: false` and land on the `PendingApproval` screen until an admin approves them in **Admin → Approvals**.

## Proposed change
1. **Edge function `create-athlete`**
   - Change `is_approved: true` → `is_approved: false` in the profile update.
   - Keep everything else (club inheritance, coach link via `coach_athletes`, email confirmed, demo metadata) as-is, so the athlete still appears under the coach immediately and the admin sees them in the pending queue.

2. **Coach UX (`CreateAthleteDialog.tsx`)**
   - Update the success toast/description to make the new behavior obvious, e.g. *"Athlete created — pending admin approval before they can sign in."*
   - Add localized strings (`da`, `en`, `sv`, `de`, `ar`) for the new message.

3. **Admin queue (`AdminApproval.tsx`)**
   - No code change needed — coach-created athletes will show up here automatically because they now have `is_approved = false`. Worth verifying visually.

4. **Athlete login experience**
   - No change needed — `PendingApproval.tsx` already handles unapproved users.

## Open question
Do you want **admin-created** athletes (admin uses the same dialog) to also require approval, or should admins be auto-approved? Simplest is: everyone created via this dialog is pending until an admin clicks approve — admins can approve their own creations in one click. Let me know if you'd prefer admins to bypass.

## Out of scope
- No DB schema or RLS changes.
- No change to coach approval flow.
- No change to the "add by code" flow (that links an existing athlete to a coach; the athlete's approval status is unchanged).
