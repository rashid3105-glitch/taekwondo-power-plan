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

## 7. Dev hot-reload vs native build (IMPORTANT)
The `server.url` block in `capacitor.config.ts` was used during early development
to hot-reload the Android app from the Lovable preview URL. **It is now removed**
because:
- A real device has no Lovable login session, so the preview URL responds with
  a "proxy error" overlay instead of the app.
- Health Connect only bridges reliably when the web layer is loaded from inside
  the app bundle (not from a remote origin).

The app now loads `dist/index.html` from inside the bundle. Iteration loop:
```bash
git pull
npm install        # only if package.json changed
npm run build
npx cap sync android
# then re-run from Android Studio
```

If you ever want hot-reload back temporarily for non-native UI work, re-add:
```ts
server: {
  url: 'https://a65f5c86-1a84-4640-b139-4767189347ea.lovableproject.com?forceHideBadge=true',
  cleartext: true,
}
```
…but expect Health Connect to fail in that mode. Remove again before submitting
to the Play Store.

