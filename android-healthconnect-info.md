# Android Health Connect setup (do this in Android Studio after `npx cap add android`)

The `capacitor-health` plugin already installed for iOS also bridges Android **Health Connect**, so no extra npm package is needed. You only need to wire native permissions and (on Android 14+) declare the Health Connect intent filter.

## 1. Prerequisites on the test device
1. Install **Health Connect** from the Play Store (pre-installed on Android 14+).
2. In Health Connect, grant your data sources (Wear OS watch, Fitbit, Samsung Health, Google Fit, etc.) permission to write **Sleep, Heart rate, HRV, Steps, Exercise**.

## 2. After running `npx cap add android` on your Mac/PC

Open `android/app/src/main/AndroidManifest.xml` and add the following inside the top-level `<manifest>` element (NOT inside `<application>`):

```xml
<!-- Health Connect read permissions (MVP scope) -->
<uses-permission android:name="android.permission.health.READ_SLEEP" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
<uses-permission android:name="android.permission.health.READ_STEPS" />
<uses-permission android:name="android.permission.health.READ_EXERCISE" />

<!-- Allows the system Health Connect privacy-policy screen to open ours -->
<queries>
  <package android:name="com.google.android.apps.healthdata" />
  <intent>
    <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
  </intent>
</queries>
```

Then inside the existing `<activity android:name=".MainActivity" ...>` block, add this intent-filter so Health Connect can open a "How we use your data" screen (required for Play Store review):

```xml
<intent-filter>
  <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
</intent-filter>
```

## 3. Set minSdk to 26
Open `android/variables.gradle` and ensure:
```gradle
minSdkVersion = 26
```
Health Connect requires Android 8.0+ (API 26).

## 4. Sync and run
```bash
npx cap sync android
npx cap open android
```
Press ▶ in Android Studio with your phone connected (USB debugging enabled).

## 5. In the app
Settings → Wearables → **Connect Health Connect** → grant permissions in the Health Connect dialog.
Background sync runs on app open (rate-limited to once every 30 minutes).

## 6. Privacy policy URL (required by Google Play if you ship)
You must host a privacy policy that explains how Sportstalent uses Health Connect data. Sportstalent's existing `/privacy` page already covers this — link to `https://sportstalent.dk/privacy` in the Play Console listing.

## 7. Before Play Store submission
Remove the `server` block from `capacitor.config.ts` so the app loads the bundled
`dist/` build instead of the Lovable sandbox URL, then run `npm run build && npx cap sync android`.
