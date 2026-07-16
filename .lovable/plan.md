# Advice: Update the iOS native build

You don't need any code changes in Lovable for this. The recent fixes (HealthKit plugin registration + `wearable-ingest` CORS/deploy) are already committed to the repo and the edge function is live. What's missing is refreshing your local iOS build so the device runs the latest web bundle and native plugin registration.

## Steps to run locally on your Mac

```text
1. git pull                       # pull the latest Lovable commits (healthkit.ts, wearable-ingest, MainViewController)
2. npm install                    # in case dependencies changed
3. npm run build                  # rebuild the web bundle that Capacitor ships inside the app
4. npx cap sync ios               # copies web build + refreshes native plugin registration
5. npx cap open ios               # open Xcode
```

In Xcode:

```text
6. Product → Clean Build Folder   (Shift+Cmd+K)  — clears stale SportstalentHealthKit artifacts
7. Delete the app from the test device/simulator — forces a fresh WebView cache
8. Product → Run (Cmd+R) on the physical iPhone paired with the Apple Watch
```

## What to verify after launch

- Xcode console shows `[SportstalentHealthKit] Plugin load()` at startup.
- App console logs `nativeHeaderRegistered: true` and `plugin available: true`.
- After granting HealthKit permission, the wearable sync completes without `FunctionsFetchError` — a network request to `wearable-ingest` returns 200 with `{ inserted: N, workouts_inserted: M }`.

## If it still fails

- `UNIMPLEMENTED` again → the build shipped stale native code. In Xcode: delete `~/Library/Developer/Xcode/DerivedData`, re-run `npx cap sync ios`, rebuild.
- `FunctionsFetchError` again → confirm the device is online and that `src/integrations/supabase/client.ts` points at the current project (it's auto-generated, don't edit).
- Web-only preview in Lovable will always show `plugin_not_registered` — HealthKit only works in the native build.

## Nothing to change in the repo

No Lovable file edits are proposed. If you'd like me to also bump the iOS `CFBundleVersion` / `CFBundleShortVersionString` in `ios/App/App/Info.plist` before you archive for TestFlight, say the word and I'll add that as a follow-up plan.