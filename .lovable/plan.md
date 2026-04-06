

## Plan: Allow coaches to set up their profile while pending approval

### Problem
When a coach signs up, they're redirected to `/pending-approval` from the Dashboard because `is_approved` is `false`. The PendingApproval page has no link to ProfileSetup, so they can't fill in their profile while waiting. The profile update itself works fine via RLS (protected fields are preserved), it's purely a navigation issue.

### Changes

**1. Add "Set up profile" button to PendingApproval page** (`src/pages/PendingApproval.tsx`)
- Add a Button linking to `/profile-setup` so coaches (and all pending users) can fill in their athlete/coach profile while awaiting approval.
- Use a secondary/outline style with a User icon, placed above the sign-out button.

**2. No database or RLS changes needed**
- The existing "Users can update their own profile" RLS policy already allows unapproved users to update non-protected fields (age, belt, goals, etc.). The `is_approved` field is protected and stays unchanged. Profile saving will work correctly.

### Technical details
- Single file change: `src/pages/PendingApproval.tsx` — add a `<Button>` with `onClick={() => navigate("/profile-setup")}`.

