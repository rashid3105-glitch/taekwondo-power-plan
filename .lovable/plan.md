## Root cause (native iOS/Android only)

The food scanner uses `@capacitor/camera` with `CameraResultType.DataUrl`. While the native camera UI is on screen, the WKWebView is backgrounded. The `DataUrl` response returns the JPEG as one large base64 string, which we then:
1. store in React state (`setImage`),
2. re-decode inside `downscaleImage` and again during `analyzeImage` upload.

On iPhones under any memory pressure, WKWebView is evicted, so when the camera dismisses ("Use Photo") Capacitor cold-starts the web layer. The app boots at `"/"` (Landing) instead of resuming `/dashboard?tab=nutrition` — that is the "back to front page" symptom.

A secondary contributor: on cold start `main.tsx` races `hydrateAuthFromPreferences()` against a 1500 ms timeout and renders regardless. If the race times out, the user renders as signed-out and RootRedirect sends them to `/`, so even the URL is lost.

Web is unaffected because `<input type="file">` never backgrounds the page.

## Fix (two independent, together they resolve it)

### 1. Stop returning the photo as base64 through the bridge — `src/components/FoodScanner.tsx`

Change `nativePickPhoto` to request `CameraResultType.Uri` instead of `DataUrl`, then read the file via `fetch(webPath).blob()` and feed it into the existing `handleImage(file: File)` path.

- Removes the multi-MB base64 string from JS heap → eliminates the WKWebView eviction that drops the user back to `/`.
- Reuses the existing `downscaleImage` pipeline (which already produces the compressed data URL that `analyzeImage` needs) so the rest of the component is untouched.
- Keep the current `quality: 80`, `width: 1280`, `correctOrientation: true`, and both `CameraSource.Camera` / `CameraSource.Photos` variants.
- Keep the cancel-detection branch (`/cancel/i`, `/user\s*denied/i`) unchanged.

No other code paths in `FoodScanner.tsx` change — `handleImage`, `analyzeImage`, `logMeal`, and the manual entry flow are all correct.

### 2. Make cold-start resilient so the URL survives even if a WebView kill still happens — `src/components/FoodScanner.tsx` + `src/main.tsx`

- In `FoodScanner.tsx`, right before calling `CapCamera.getPhoto(...)` on native, persist a short "resume hint" to Capacitor `Preferences` (key e.g. `scanner:last_route`) with the current `location.pathname + search`. On mount of `FoodScanner` (or in the nutrition tab), read and clear this hint; if present and it points at the nutrition tab, no-op (we're already here). This is a belt-and-braces resume marker — the primary fix in step 1 already prevents the kill.
- In `src/main.tsx`, raise the `hydrateAuthFromPreferences` timeout from `1500 ms` to `4000 ms` and, additionally, do NOT render until either hydration resolves OR the timeout fires — current code already does this, so the change is just the longer timeout. This prevents the "rendered as signed-out on cold start → redirected to `/`" race on older iPhones.

### 3. Verification checklist (no speculative changes)

- `rg` search to confirm no other component uses `CameraResultType.DataUrl` for large photos — if any do (e.g. `AddRecipeForm` currently uses `<input>` only, so it's fine), leave them alone.
- Build the web bundle; run `tsgo` on the changed file.
- Manual test steps to give the user after they `git pull` + `npx cap sync ios`:
  1. Open Nutrition tab → "Tag billede" → take a photo → tap "Use Photo" → expect to land back on the scanner with the photo preview, not on `/`.
  2. Same for "Upload" → pick from library → "Choose".
  3. Kill the app between steps to confirm the resume hint / longer hydration timeout also keep the user on the correct tab on a hard cold start.

## Files to edit

- `src/components/FoodScanner.tsx` — swap `DataUrl` for `Uri` + blob fetch inside `nativePickPhoto`; add small resume-hint write/read (~15 lines).
- `src/main.tsx` — bump the auth-hydration timeout from `1500` to `4000` ms.

## Explicitly NOT changing

- `capacitor.config.ts` (no `server.url` reintroduction).
- Native iOS/Android project files.
- `AddRecipeForm.tsx` (uses `<input>`, not affected).
- The `scan-food` edge function, storage bucket, or any DB schema.
