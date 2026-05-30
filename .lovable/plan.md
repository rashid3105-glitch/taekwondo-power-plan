## Goal
Make the profile picture persist reliably after saving and navigating away, with the smallest safe fix.

## What I found
- The backend is healthy.
- Your profile row currently has `avatar_url = null`.
- The storage file does exist in the `avatars` bucket for your user.
- That means the image upload succeeded, but the profile record did not keep the image path.
- The current `ProfileSetup.tsx` flow uploads the image first and only saves `avatar_url` later when the main profile form is submitted.
- While that upload is running, the Save button is still enabled because it only depends on `loading`, not `uploading`.
- If Save is pressed before the upload finishes, the form submits `avatar_url: null`, so the profile saves successfully but without the image. That matches your symptom exactly: image appears briefly, then disappears after navigation/reload.
- The previous “fix” only added a verification read after save. It did not fix this race condition.

## Plan
1. Update `src/pages/ProfileSetup.tsx` so the profile form cannot be submitted while the avatar upload is still in progress.
2. Make the save path use the final uploaded avatar path reliably, so it never sends `null` when an upload is still pending.
3. Keep the existing verification step, but make its error handling clearer around avatar persistence.
4. Validate the result by checking that:
   - the profile row contains the avatar path after save
   - the dashboard/front page still reads the avatar from the profile row after navigation

## Technical details
- Primary file: `src/pages/ProfileSetup.tsx`
- Likely change set:
  - disable submit when `uploading || loading`
  - guard `handleSubmit` from running during upload
  - ensure avatar state used in payload is the completed uploaded path only
- No database migration needed.
- No backend schema change needed.
- The display/render side (`useAvatarUrl`, dashboard/profile readers) looks consistent once `profiles.avatar_url` is actually populated.