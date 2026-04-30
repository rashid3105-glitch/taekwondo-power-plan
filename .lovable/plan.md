# Plan: fix the persistent “not in native app” message on iPhone

## What I think is actually happening
The issue is likely no longer just one missing bridge check. At this point there are two concrete possibilities:

1. The app is running in a real native shell, but our detection is still too strict and misses valid Capacitor-on-iOS cases.
2. The iPhone build is still using an older bundled web build, which matches your screenshot because the new diagnostics/details UI does not appear there.

## What I’ll change

### 1) Make native detection accept more real iOS native signals
Update `src/lib/wearables/index.ts` so `inNativeApp` can also become true when any of these are present:
- `Capacitor.isNativePlatform()`
- `Capacitor.getPlatform() === "ios" | "android"`
- `window.Capacitor.getPlatform()`
- registered plugin presence via `Capacitor.isPluginAvailable("Health")`
- iOS WebView markers combined with iPhone/iPad user agent
- local Capacitor URL patterns such as `http://localhost` that occur inside native WebViews

This removes the current gap where the app may be native, but still falls back to `web`.

### 2) Add stronger raw diagnostics so the next screen tells us exactly which bundle is running
Extend diagnostics in `src/lib/wearables/index.ts` and the UI in:
- `src/pages/WearablesSettings.tsx`
- `src/components/wearables/WearableConnectWizard.tsx`

I’ll show extra fields such as:
- current URL
- whether it is `http://localhost`
- whether the Health plugin is registered
- whether the imported health module loaded
- a build/version marker from the current JS bundle

That way we can distinguish “native runtime but weak detection” from “phone still running an old build”.

### 3) Replace the misleading fallback copy
Right now the wizard jumps straight to “you are not in the native app”. I’ll change that so the message is more precise:
- if native signals exist: say native shell detected, but bridge/plugin/bundle is not ready
- only say “not in native app” when all native signals are genuinely absent

### 4) Add explicit stale-bundle guidance
If the diagnostics suggest the iPhone is running an older bundle, the UI will say so directly and tell the user to:
- pull latest code
- run `npm run build`
- run `npx cap sync ios`
- rebuild from Xcode

## Technical details
- Files to update:
  - `src/lib/wearables/index.ts`
  - `src/pages/WearablesSettings.tsx`
  - `src/components/wearables/WearableConnectWizard.tsx`
  - `src/i18n/translations.ts`
- No backend or database changes
- No native Swift changes unless diagnostics prove the Health bridge is missing from the iOS project itself

## Expected result
After this change, one of two things should happen on device:
- the app correctly recognizes the native iPhone build and lets you continue, or
- the screen shows an exact technical reason instead of the generic “not in native app” message, so the remaining issue can be fixed in one step.