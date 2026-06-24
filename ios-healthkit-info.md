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

## 5. Dev hot-reload vs native build (IMPORTANT)
The `server.url` block in `capacitor.config.ts` was used during early development
to hot-reload the iOS app from the Lovable preview URL. **It is now removed**
because:
- A real iPhone has no Lovable login session, so the preview URL responds with
  a "proxy error" overlay instead of the app.
- HealthKit only bridges reliably when the web layer is loaded from inside the
  app bundle (not from a remote origin).

The app now loads `dist/index.html` from inside the bundle. Iteration loop:
```bash
git pull
npm install        # only if package.json changed
npm run build
npx cap sync ios
# then re-run from Xcode
```

If you ever want hot-reload back temporarily for non-native UI work, re-add:
```ts
server: {
  url: 'https://a65f5c86-1a84-4640-b139-4767189347ea.lovableproject.com?forceHideBadge=true',
  cleartext: true,
}
```
…but expect HealthKit to fail in that mode. Remove again before submitting to
the App Store.

