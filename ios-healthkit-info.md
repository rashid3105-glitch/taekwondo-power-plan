# iOS HealthKit setup (Xcode + native build)

The app integrates directly with Apple HealthKit through a **local Capacitor
8 App-target plugin** that lives inside the iOS project:
`ios/App/App/SportstalentHealthKit.swift`. There is **no external npm package**
and no legacy Objective-C `.m` bridge for the HealthKit bridge. The active
`MainViewController` registers the Swift `CAPBridgedPlugin` instance explicitly
with Capacitor during `capacitorDidLoad()`.

V1 scope is pure observations: we read 6 data types (sleep, resting HR,
HRV, heart rate, active energy, workouts) and forward them to the
`wearable-ingest` edge function, which updates the existing
`wearable_daily_summary` via `recompute_wearable_summary`. No score, no
recommendation, no color coding is derived from HealthKit data.

## 1. Enable HealthKit capability in Xcode
1. Open the iOS project: `npx cap open ios`
2. Select the **App** target → **Signing & Capabilities**.
3. Click **+ Capability** → add **HealthKit**.
4. Leave **Clinical Health Records** and **Background Delivery** unchecked
   (not used in V1).

The entitlement is already in `ios/App/App/App.entitlements`:
```xml
<key>com.apple.developer.healthkit</key>
<true/>
```

## 2. Info.plist usage strings (already set)
`ios/App/App/Info.plist` contains the required read description. We do NOT
write to HealthKit.

```xml
<key>NSHealthShareUsageDescription</key>
<string>Sportstalent læser dine sundhedsdata (søvn, puls, HRV og træning) fra Apple Health for at vise din restitution og dokumentere din træning.</string>
```

## 3. Sync and run
```bash
git pull
bun install       # or npm install
npm run build
npx cap sync ios
npx cap open ios
```
Then press ▶ in Xcode with your iPhone connected. **No `pod install` step**
— the project uses SPM, not CocoaPods.

If you don't see `SportstalentHealthKit.swift` and `MainViewController.swift`
in the Xcode project navigator under `App/App/`, drag them into the App target
once (Xcode sometimes needs a manual add for new files that appeared via
`git pull`).

## 4. In the app
- Settings → **Health** → **Connect Apple Health** (button only shown on
  iOS native).
- First tap triggers the iOS permission sheet. Enable all 6 categories.
- The first sync pulls 90 days of history; subsequent syncs pull the last
  30 days. Sync is throttled to at most once per hour and runs
  automatically on app open and on app resume.

## 5. Shortcut path still works
The legacy iOS Shortcut → `health-sync-simple` → `resync-health` path is
untouched. Users who don't grant HealthKit access keep the Shortcut flow
as before. For users with both paths active, HealthKit wins: since it
populates `wearable_samples`, `recompute_wearable_summary` re-aggregates
`wearable_daily_summary` from those samples.

## 6. Dev hot-reload vs native build
Do NOT re-add `server.url` to `capacitor.config.ts` when testing HealthKit —
HealthKit only bridges reliably when the web layer is loaded from inside
the app bundle.

## 7. GDPR / App Store — REQUIRED BEFORE NEXT SUBMISSION
- **Privacy policy**: add category "Sundhedsdata via Apple HealthKit
  (læsning): søvn, hvilepuls, HRV, puls, aktiv energi, træningspas."
- **App Privacy schema in App Store Connect**: add data type
  **Health & Fitness → Health**, purpose **App Functionality**, not
  linked to the user for tracking, not shared with third parties.
- Must be updated before the next TestFlight / App Store submission.
