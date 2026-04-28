# Fix "proxy error" on iPhone and enable Apple Health

## What's happening
The Capacitor config currently tells the iOS app to load the UI from the Lovable preview URL (`https://a65f5c86-...lovableproject.com`). On a real iPhone in Xcode, that URL requires a Lovable login session the phone doesn't have, which produces the "proxy error" overlay. It also prevents HealthKit from working, because HealthKit only bridges reliably when the web layer is loaded from inside the app bundle.

## What to change

### 1. Disable the dev server URL in `capacitor.config.ts`
Remove (or comment out) the `server` block so the iOS app loads `dist/index.html` from inside the app bundle instead of from the Lovable preview.

Final file:
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a65f5c861a844640b1394767189347ea',
  appName: 'Sportstalent',
  webDir: 'dist',
  ios: { contentInset: 'always' },
};

export default config;
```

### 2. Document the dev/native build trade-off
Add a short note to `ios-healthkit-info.md` (and the matching Android file) explaining:
- The `server` block was for hot-reload during early development.
- For HealthKit testing on a real device, the app must load the bundled `dist/`.
- If a developer wants hot-reload back later, they can temporarily re-add the block while testing non-native features only.

### 3. (No code) Steps for you to run on your Mac after the change
```bash
git pull                     # pull the new capacitor.config.ts
npm install                  # in case anything changed
npm run build                # build dist/
npx cap sync ios             # copy dist/ + plugins into iOS project
npx cap open ios             # reopen Xcode
```
Then in Xcode press ▶ with your iPhone connected. The proxy overlay will be gone, the app will load instantly from the bundle, and the **Connect Apple Health** button will trigger the real native permission sheet.

### 4. Iteration loop going forward
Whenever you change code in Lovable and want it on the phone:
1. `git pull` on your Mac
2. `npm run build && npx cap sync ios`
3. Re-run from Xcode

(No need to re-run `npx cap add ios` again — that's only the first time.)

## What we are NOT changing
- No frontend UX changes — `WearablesSettings.tsx` and `src/lib/wearables/index.ts` already handle the iOS path correctly.
- No database, RLS, or edge function changes.
- The web preview will continue to show the friendly "Wearables require the iOS or Android app" message — that's correct and expected on web.
