## What's actually happening

### 1. iWatch won't connect

Apple Health / HealthKit is only accessible from the **native iOS app build** of Sportstalent (Capacitor). It cannot be accessed from a normal browser, including:
- the Lovable preview window
- Safari on iPhone
- the published web URL `sportstalent.dk`

I checked the database: there is **no `wearable_connections` row for your account** and **0 wearable samples**, so the Connect button has never reached the backend. Combined with the fact that the preview you're using runs in a browser, the most likely cause is that the Connect flow is being attempted from the web, where it is correctly disabled — but the messaging is too soft and looks like a normal "Connect" button that just doesn't do anything.

### 2. "Checkbox empty after saving"

The database actually shows your profile saved with `owns_wearable = true` at 08:29 today. So it IS persisting. What's happening is one of these (both fixable):
- The Profile Setup page reloads, but the checkbox uses a plain `<input type="checkbox">` rather than the app's `Checkbox` component, so it doesn't always render the saved state cleanly on iOS Safari.
- After saving, you may be redirected somewhere that re-reads a stale profile cache.

## Plan

### A. Make the wearable connect flow honest about web vs app

In `src/pages/WearablesSettings.tsx`, when `isWearableSupported()` is false (i.e. running in the browser), replace the soft "Install app" card with a clearer block that explains:
- Apple Watch / iWatch sync **only works in the iOS app**, not in the browser.
- A direct CTA to the existing `/install` page with iPhone install instructions.
- A note that until you install the native app, you can still log workouts manually.

Also, verify the native check itself is robust: log to console which platform was detected and which plugin (if any) was found, so if you do install the iOS app and the plugin is missing we can see it immediately in the logs.

### B. Fix the checkbox UX

In `src/pages/ProfileSetup.tsx`:
- Replace the bare `<input type="checkbox">` for "I own a wearable" with the project's standard `Checkbox` component (same one used elsewhere). This guarantees consistent checked-state rendering across iOS Safari and the PWA.
- Add a tiny visual confirmation (the existing toast already fires) — no extra logic needed beyond the component swap and making sure the controlled `checked` value rehydrates from the loaded profile (which it already does at line 114).

### C. Quick sanity checks (no code change)

I'll verify after the swap:
- Save profile with the box ticked → reload `/profile-setup` → box stays ticked.
- On the Wearables page in the web preview → see the new "iOS app required" explanation.

## Files to change
- `src/pages/WearablesSettings.tsx` — clearer "browser vs app" messaging when unsupported, optional debug log when a plugin is missing.
- `src/pages/ProfileSetup.tsx` — swap raw `<input>` for the `Checkbox` component.

## Out of scope
- Building / shipping a new iOS native build (that's a separate Capacitor build & TestFlight task).
- Any DB or edge-function changes — backend works correctly.
