## Goal
Make the native app reliably recognize that it is running inside the installed iPhone app, then show the correct wearable connection state instead of incorrectly staying on “Not connected”.

## Plan
1. **Stabilize native environment detection**
   - Replace the current `globalThis.Capacitor` platform check with the recommended Capacitor import from `@capacitor/core`.
   - Use native detection consistently for both provider selection and wizard diagnostics so the installed app is not misclassified as web.

2. **Tighten the connection-state logic**
   - Review how `getStatus()` and the wizard interpret a successful permission grant versus an actual synced connection row.
   - Ensure the UI does not imply total disconnection when native permissions were granted but the first sync has not yet completed.

3. **Improve native troubleshooting copy in the affected screens**
   - Update the Wearables settings / guided flow text so it explains the exact next action when the app is native but no connection row exists yet.
   - Keep the step-by-step flow focused on the real failure modes: native app detection, plugin availability, health availability, permission prompt, and first sync.

4. **Validate the fix paths**
   - Check the relevant screens/components for build-safe TypeScript usage after the detection change.
   - Verify the fix against the existing wearable flow files only, without widening scope.

## Technical details
- Files likely involved:
  - `src/lib/wearables/index.ts`
  - `src/components/wearables/WearableConnectWizard.tsx`
  - `src/pages/WearablesSettings.tsx`
- Likely root cause:
  - Native detection currently depends on `globalThis.Capacitor`, which is brittle in Capacitor apps.
  - Capacitor recommends importing `Capacitor` from `@capacitor/core` and using `getPlatform()` / `isNativePlatform()`.
- Expected outcome:
  - The iPhone app is recognized as native.
  - The guided flow advances correctly.
  - The connection UI better distinguishes “not yet synced” from truly disconnected.