## Problem

On iPhone (Capacitor native app), tapping **"Tag billede"** in the food scanner crashes the app. The current flow uses a hidden `<input type="file" accept="image/*" capture="environment">` which opens the system camera through the WKWebView. iOS returns the photo at full resolution (often 12MP HEIC / large JPEG). The app then decodes it via `new Image()` → `<canvas>` in `downscaleImage()`, which routinely exhausts WebView memory on iPhone and kills the process. HEIC files also decode inconsistently in WKWebView.

The web upload path works because desktop/Android returns smaller files and HEIC isn't involved.

## Fix

Use the Capacitor Camera plugin on native (iOS + Android) so the photo is captured and downsized by the OS before it ever reaches the WebView. Keep the existing `<input type="file">` path as a fallback for web.

### 1. Install plugin
- Add `@capacitor/camera` to `package.json`.

### 2. `src/components/FoodScanner.tsx`
- Add a small helper `takePhotoNative()` that dynamically imports `@capacitor/camera` and calls `Camera.getPhoto({ quality: 80, resultType: DataUrl, source: CameraSource.Camera, allowEditing: false, width: 1280 })`. Returns a data URL.
- In the **"Tag billede"** button `onClick`:
  - If `Capacitor.isNativePlatform()` → call `takePhotoNative()`, then run the returned data URL through the existing `dataUrlByteLength` guard and `setImage(dataUrl)` (skip `downscaleImage` since Camera already sized it; only re-encode if it still exceeds the 4 MB cap).
  - Otherwise → keep current `inputRef.current?.click()` behaviour.
- Wrap the native call in try/catch; ignore `User cancelled` errors; toast a friendly message on other failures.
- Leave the **"Upload billede"** button unchanged (it uses the gallery input, which is stable).

### 3. iOS permissions
- Add to `ios/App/App/Info.plist`:
  - `NSCameraUsageDescription` — "Sportstalent bruger kameraet til at scanne dine måltider."
  - `NSPhotoLibraryUsageDescription` — "Sportstalent bruger fotos til at scanne dine måltider."
- User will need to run `npx cap sync ios` locally after pulling.

### Non-goals
- No changes to `scan-food` edge function, upload flow, manual entry, or the UI layout.
- No change to the web/desktop camera path.
- No change to Android beyond enabling the same plugin (Camera plugin auto-registers on both platforms).
