## Goal
Show a small thumbnail of the scanned meal in the "Dagens måltider" list on the nutrition dashboard, so the user can see what their logged calories consist of instead of the picture disappearing after logging.

## Scope
Only the food‑scan → nutrition log path. Manual entries (no photo) stay as they are and just render without a thumbnail.

## Changes

### 1. Backend
- New migration adds `image_url text` column to `public.nutrition_logs` (nullable, no default). Existing rows stay untouched.
- Create a public storage bucket `meal-photos` via the storage tool.
- Add RLS policies on `storage.objects` so a user can insert/select/delete only their own files under a `{user_id}/…` path prefix. Public SELECT so the thumbnail loads without a signed URL.

### 2. FoodScanner (`src/components/FoodScanner.tsx`)
- After a successful scan, when the user taps "Log måltid":
  1. Take the already‑compressed data URL currently in `image`, convert it to a `Blob`.
  2. Upload to `meal-photos/{user_id}/{uuid}.jpg` (content‑type `image/jpeg`, cacheControl 1 year).
  3. Get the public URL and include `image_url` in the `nutrition_logs.insert` payload.
- Failure to upload is non‑fatal: log the meal without an image and toast a soft warning.
- Manual‑entry flow (`logManual`) is unchanged (no image).

### 3. Dashboard list (`src/components/DailyNutritionDashboard.tsx`)
- Extend the `MealLog` type and the `select(...)` string with `image_url`.
- In the meal `<li>`, render a 40×40 rounded thumbnail on the left when `image_url` is present; fall back to the existing `Utensils` icon in a muted square when it is null (manual entries).
- Keep layout, delete button, and text unchanged otherwise.

### 4. Cleanup on delete
- In `handleDelete`, if the deleted log had an `image_url`, best‑effort `supabase.storage.from("meal-photos").remove([path])` after the row delete succeeds. Ignore errors — the row is already gone.

## Non‑goals
- No change to the scanner UI itself, the AI prompt, macro math, or the manual entry flow.
- No historical backfill — only meals logged after this change get a thumbnail.
- No lightbox / full‑size preview yet (can be added later if wanted).

## Technical notes
- Image size is already capped in the scanner (`MAX_SCAN_IMAGE_BYTES`), so no extra compression step is needed before upload.
- Storage path uses `crypto.randomUUID()` to avoid collisions and to make per‑user RLS trivial (`(storage.foldername(name))[1] = auth.uid()::text`).
- Public bucket keeps the dashboard render synchronous (no signed‑URL round trip per row). Filenames are UUIDs so URLs are effectively unguessable.
