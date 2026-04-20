

## Diagnosis: Pavlina Dang — profile picture not saved

### What I checked

1. **Database** (`profiles.avatar_url` for user `fb5a2624-...`): **NULL**. Last `updated_at` 2026-04-20 06:00:49.
2. **Storage** (bucket `avatars`, folder `fb5a2624-.../`): **empty — zero objects**.
3. **Storage RLS**: INSERT policy correctly requires `foldername[1] = auth.uid()` → fine.
4. **Upload code** (`src/pages/ProfileSetup.tsx`, `handleAvatarUpload`, lines 129-165).

### Conclusion: the upload never succeeded — no file ever reached the bucket

Because storage is empty for her user folder, the issue isn't that the URL was lost — the file itself was never saved. There are **three real bugs in `handleAvatarUpload`** that explain why this can silently fail for some users while appearing to work for others:

### Bug 1 — Profile UPDATE bypasses the service-role rule (most likely root cause)

The avatar handler writes directly to `profiles` from the client:
```ts
await supabase.from("profiles").update({ avatar_url: filePath }).eq("user_id", user.id);
```
But your RLS policy "Users can update their own profile" has a complex `WITH CHECK` that compares `is_approved`, `payment_status`, `payment_date`, `is_demo`, `demo_full_access`, `club_id` against `get_profile_protected_fields(auth.uid())`. **If the in-memory row the client sends back differs in any of those (e.g. `club_id` was just changed by an admin, or the local cached profile is stale), the UPDATE silently fails with an RLS error** — which the code never catches because the `await` has no `.error` check. This is exactly the failure mode your memory `mem://tech/data-update-reliability` warns about: "critical user-profile updates must go through `update-my-profile` Edge Function."

The whole rest of the profile already does this. Avatar is the one place that didn't get migrated.

### Bug 2 — The storage upload error is silently swallowed in some browsers

If the upload throws (e.g. iOS Safari with HEIC files, files >5 MB, lost session), the catch shows a toast but the user often misses it. There's no retry, and the avatar field also has no required-validation, so the form continues and "saves" successfully without ever having an avatar.

### Bug 3 — File extension assumption

`filePath = ${user.id}/avatar.${ext}` uses the original extension. If iPhone uploads a `.HEIC` (uppercase) or no extension, the `upsert: true` still works — but the later `useAvatarUrl` signed-URL fetch can fail to render in browsers that can't display HEIC. Less likely the cause here (the row is NULL, meaning even the path was never stored), but worth fixing alongside.

### Likely scenario for Pavlina specifically

Looking at her record: she has no `avatar_url` and her profile was last updated 06:00:49 today. The most plausible sequence:
1. She picked a photo on iPhone.
2. Either (a) the upload threw silently (HEIC/size/network) or (b) the upload succeeded but the **subsequent direct `profiles.update` was rejected by RLS** because of the protected-fields check. Storage being empty actually points to **(a)** — the upload itself never landed.
3. She then submitted the rest of the form, which went through `update-my-profile` correctly, so name/club/etc. all saved — but never an avatar.

### Plan to fix (when switched to default mode)

1. **Move avatar persistence into the existing `update-my-profile` Edge Function.** Add `avatar_url` to its zod schema (nullable string, max length) and let the service-role client write it. Remove the client-side `profiles.update` call from `handleAvatarUpload`. This eliminates Bug 1 and matches the project rule in `mem://tech/data-update-reliability`.
2. **Always write `avatar_url` on form submit, not on file pick.** Currently the path is written immediately on upload; if the user uploads a photo then closes the page without hitting "Save", state is half-applied. After the fix, `handleAvatarUpload` only uploads to storage and sets local state; the path is persisted as part of the main `update-my-profile` payload along with everything else.
3. **Surface upload failures loudly.** Check `uploadError` first, and if storage upload fails, show a destructive toast that doesn't auto-dismiss + log the error to the console with the file size/type so we can diagnose iOS HEIC cases.
4. **Normalize the file extension.** Lowercase the extension and reject `.heic`/`.heif` with a clear message ("Please use JPG or PNG — iPhone Settings → Camera → Formats → Most Compatible"), or convert in-browser. Simpler: reject + clear instruction.
5. **Add a one-off remediation for Pavlina.** No DB fix needed — her row is just NULL. After the code fix is deployed, ask her to re-upload the photo. (No migration required.)

### Files to be modified

- `supabase/functions/update-my-profile/index.ts` — add `avatar_url` to schema + update.
- `src/pages/ProfileSetup.tsx` — `handleAvatarUpload`: upload only, set local state, no direct DB write; `handleSubmit`: include `avatar_url` in payload; reject HEIC; loud error toast.

### Verification after the fix

- Upload a JPG → confirm both `storage.objects` row appears AND `profiles.avatar_url` populates.
- Try uploading a HEIC → confirm clean rejection toast, nothing partially saved.
- Pretend RLS rejects (temporarily flip a protected field) → confirm the edge function path still works while a direct client write would have failed.

