## Why your iWatch isn't connecting

I dug into the database and the code. Two real problems are stacking on top of each other:

1. **Your Apple Health connection in our backend is marked `revoked`** (from a previous disconnect). The Wearables screen only shows the green "Connected" card when status is active, so when you tap *Connect Apple Health* nothing visible happens for the connection state — even if iOS prompts.
2. **The Apple Health permission prompt is silently denied by iOS.** Apple requires the HealthKit permission request to be triggered *immediately* from the button tap, with no `await` in between. Today our `handleConnect` does `await requestPermissions()` *after* the React state update, and our `requestPermissions()` itself does several `await` calls (dynamic import of `capacitor-health`, availability check) before finally calling `requestHealthPermissions`. On iOS, that broken "user gesture" chain is the #1 reason the system sheet never appears.

There is also zero data in `wearable_samples` for any user, and the edge function has never logged an invocation — so the device truly isn't reaching the bridge yet. Fixing the prompt is the unlock.

## What I'll change

### 1. Fix the iOS user-gesture chain so the Health prompt actually shows
- Pre-load the `capacitor-health` module on the Wearables screen mount, so when you tap the button there is **no `await` before** `requestHealthPermissions`.
- Remove the `await Health.isHealthAvailable()` step from inside the request path; move it to a separate "diagnostics" check that runs on screen load.
- Call `requestHealthPermissions` synchronously in the click handler, then do the backfill afterwards.

### 2. Re-activate a revoked connection automatically
- When the user taps *Connect Apple Health* and a previous row exists with `status = revoked`, flip it back to `active` as part of the connect flow (the ingest function already upserts active, but the connect button currently never reaches ingest because the prompt is silently denied).
- Add a small "Reset connection" affordance under *Re-request health permissions* that wipes the revoked row so the next connect is a clean start.

### 3. Make the screen tell the truth about what's happening
- Show a one-line **diagnostic strip** on Wearables Settings the moment the page loads, with three green/amber dots:
  - "Running in native iOS app" (true/false)
  - "Apple Health available on this device" (true/false)
  - "HealthKit entitlement detected" (true/false based on whether `capacitor-health` exposes the iOS plugin)
- If any are false, tell the user exactly what to do (rebuild from Xcode after `npx cap sync ios`, or open Apple Health → Sources → Sportstalent and enable each metric).
- After tapping Connect, log the raw response from `requestHealthPermissions` and show it on the Sync screen so we can see if iOS actually granted any types.

### 4. Verify the loop end-to-end
- After the Health sheet is granted, run the 14-day backfill, confirm rows appear in `wearable_samples`, and confirm `wearable_connections.last_sync_at` becomes non-null and `status = active`.
- If the breakdown still shows all zeros, the Sync screen will now point to the exact Apple Health toggle that's off (Sleep / Resting HR / HRV / Steps / Workouts).

## What you'll need to do once on the phone

These are one-time native-build steps that I can't do for you from here, but the plan above only works if they're already true:

1. You must be running a build that came from `npm run build && npx cap sync ios` and was launched from Xcode (or TestFlight). The Lovable preview URL on Safari can't talk to HealthKit.
2. In Xcode → Signing & Capabilities, the **HealthKit** capability must be added to the App target.
3. `Info.plist` must contain `NSHealthShareUsageDescription` (and `NSHealthUpdateUsageDescription`). Both are already documented in `ios-healthkit-info.md`.

If any of those are missing, iOS will silently refuse to show the prompt no matter what we change in the JS layer.

## Files I'll touch

- `src/lib/wearables/index.ts` — pre-load the plugin, remove `await` chain before `requestHealthPermissions`, return raw permission result.
- `src/pages/WearablesSettings.tsx` — diagnostic strip, "Reset connection" button, click handler that calls the bridge with no awaits in between.
- `src/pages/WearablesSync.tsx` — show last permission grant payload and clearer per-metric guidance.
- (Possibly) a tiny helper to flip `status` from `revoked` → `active` via the existing ingest function (no new migration needed; the upsert already handles it once a real sync runs).

No DB migration. No new edge function.
