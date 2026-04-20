

## Diagnosis: Why Pavlina still gets an upload error

### Evidence collected

1. **Pavlina's `avatar_url` is still NULL** and her storage folder `fb5a2624-.../` is **still empty**. Profile last updated at 06:00:49 UTC today (before our fix was deployed at ~07:00).
2. **Ky Tu Dang (her account / family member)** successfully uploaded twice today — once a **1.87 MB PNG** at 07:07 and once a **142 KB JPEG** at 07:29. Both files exist in storage.
3. **Storage RLS** is correct — INSERT requires `foldername[1] = auth.uid()`. Not the cause.
4. **`update-my-profile` Edge Function** logs show one POST today returning **200 OK** (the successful save). No error responses.
5. **No storage upload errors in logs** for Pavlina's user_id.

### Conclusion

Pavlina has not actually retried the upload since our fix was deployed — her last activity was at 06:00, before the fix. **The error she's seeing is most likely from the Edge Function, not from storage.** Specifically:

### Likely root cause: Zod schema rejects the avatar_url value

The `update-my-profile` schema we added validates `avatar_url` with `z.string().max(500).nullable().optional()`. But the client sends:

```ts
const cleanAvatarUrl = avatarUrl ? avatarUrl.split("?")[0] : null;
```

`avatarUrl` in state is set to `${filePath}?t=${Date.now()}` after upload. After `.split("?")[0]` it becomes `fb5a2624-404d-43c3-baf5-cd21efe512aa/avatar.jpg` — which passes validation. **BUT** if she had a previously failed half-state where `avatarUrl` was an empty string `""`, the schema accepts it (string passes `.string()`), and then the DB update writes empty-string into `avatar_url` — no visible photo. Or worse, if she initially had a remote URL with multiple query params, the split logic breaks.

More importantly: **looking at Ky Tu Dang's storage**, she has BOTH `avatar.png` AND `avatar.jpeg` files. The newest is `.jpeg` (note: **5 letters, not 3**). Our code does:

```ts
let ext = (original.name.split(".").pop() || "").toLowerCase();
// ...
const filePath = `${user.id}/avatar.${ext}`;
```

iPhone JPEG photos often arrive named `IMG_1234.jpeg` (5-letter extension) → file gets stored as `avatar.jpeg`. But `useAvatarUrl` and any display code likely look for `.jpg` / `.png` only — the photo uploads but never displays, making it look like an "error" to the user.

### Plan to finalize the fix

1. **Normalize the extension to a canonical short form** in `handleAvatarUpload`:
   - `jpeg` / `jpe` → `jpg`
   - `tif` → `tiff` is fine
   - Anything else → only allow `jpg`, `png`, `webp`, `gif`; reject otherwise with a clear toast.

2. **Add server-side defense in `update-my-profile`**: trim `avatar_url`, treat empty string as null, and validate that it matches `^[0-9a-f-]{36}/avatar\.(jpg|png|webp|gif)$` so a malformed path can never land in the DB.

3. **Add an inline "save status" indicator** on the avatar button so the user gets instant visual feedback after upload AND after form save (currently the photo appears optimistically from local state but only persists after clicking "Save Profile" — easy to miss and exit the page early).

4. **Live test with browser automation** after the fix:
   - Log in as Pavlina (or test account in same club), upload a JPEG, observe storage row + DB column populate, refresh, confirm photo persists.

5. **Backfill check for Ky Tu Dang**: her storage has `.jpeg` and `.png` but `profiles.avatar_url` for her user (978b9a71) — let me note we should also verify it points to the correct file after the fix.

### Files to modify

- `src/pages/ProfileSetup.tsx` — extension normalization + allowlist + clearer post-save feedback.
- `supabase/functions/update-my-profile/index.ts` — server-side avatar_url regex validation.
- `src/hooks/useAvatarUrl.ts` — verify it handles `.jpeg` (not just `.jpg`); read first to confirm.

### What I need from you to complete verification

After approval and deployment, I'll need either Pavlina to retry (and tell me the exact error wording / take a screenshot) or your permission to log in as a test athlete in her club and reproduce the upload flow end-to-end via the browser tool.

