# iOS HealthKit setup (do this in Xcode after `npx cap add ios`)

## 1. Enable HealthKit capability
1. Open the iOS project: `npx cap open ios`
2. In Xcode, select the **App** target → **Signing & Capabilities** tab.
3. Click **+ Capability** → add **HealthKit**.
4. (Leave "Clinical Health Records" and "Background Delivery" unchecked for the MVP.)

## 2. Add Info.plist usage strings
Open `ios/App/App/Info.plist` and add the following two keys inside the top-level `<dict>`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Sportstalent reads your sleep, resting heart rate, HRV, steps and workouts from Apple Health to personalize your training and recovery.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Sportstalent does not write data to Apple Health.</string>
```

Both keys are required by Apple when the HealthKit entitlement is present, even though we only read.

## 3. Sync and run
```bash
npx cap sync ios
npx cap open ios
```
Then press ▶ in Xcode with your iPhone connected.

## 4. In the app
Settings → Wearables → **Connect Apple Health** → grant permissions.
Background sync runs on app open (rate-limited to once every 30 minutes).

## 5. Before App Store submission
Remove the `server` block from `capacitor.config.ts` so the app loads the bundled
`dist/` build instead of the Lovable sandbox URL, then run `npm run build && npx cap sync ios`.
