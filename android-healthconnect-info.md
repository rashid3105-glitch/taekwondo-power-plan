# Android Health Connect setup

> ## SCOPE STATUS - READ THIS FIRST (21 Aug 2026)
>
> Health Connect on Android is on **MINIMUM SCOPE**. Only two permissions are
> requested:
>
> | Permission | Status |
> |---|---|
> | `READ_EXERCISE` | active |
> | `READ_ACTIVE_CALORIES_BURNED` | active |
> | `READ_SLEEP` | **removed 21 Aug 2026** |
> | `READ_HEART_RATE` | **removed 21 Aug 2026** |
> | `READ_STEPS` | **removed 21 Aug 2026** |
> | `READ_RESTING_HEART_RATE` | removed earlier (Aug 2026, same policy) |
> | `READ_HEART_RATE_VARIABILITY` | removed earlier (Aug 2026, same policy) |
>
> **Why:** Google Play enforced "Politikken vedrorende tilladelser for Health
> Connect by Android: Overdreven dataadgang for den angivne funktion" on
> **20 Aug 2026**. The live Android version was blocked and an earlier version
> served instead. Google explicitly listed HeartRate, SleepSession and
> Steps as not required for the features the app declares. It did NOT object
> to Exercise or ActiveCaloriesBurned.
>
> **This was the SECOND round of the same policy.** Resting HR and HRV were
> removed in an earlier round. Do not treat this point as closed.
>
> **Re-adding any type requires FOUR matching changes, or it fails silently:**
> 1. `android/app/src/main/AndroidManifest.xml`
> 2. `recordClass()` in `android/app/src/main/java/dk/sportstalent/app/SportstalentHealthConnect.kt`
> 3. `READ_TYPES` in `src/lib/healthConnect.ts`
> 4. Play Console -> **Health apps declaration** AND **Data safety**
>
> The silent failure mode: `requestAuthorization` resolves
> `allGranted = granted.containsAll(requested)`. If JS requests a type the
> manifest does not declare, `allGranted` is false and the "Connect Health
> Connect" button appears to fail - with no error shown to the user.
>
> **To get sleep / heart rate / steps back** you need a Health apps declaration
> that maps each data type to a demonstrable in-app screen, plus a demo video
> showing the navigation path to that screen with real data on it. That is a
> separate submission - do not bundle it with an unrelated release.
>
> **iOS HealthKit is UNAFFECTED** and still reads sleep, resting HR, HRV,
> heart rate, active energy and workouts. See `ios-healthkit-info.md`.

---

## Native plugin

The Android bridge is a **local Capacitor 8 Kotlin plugin** at
`android/app/src/main/java/dk/sportstalent/app/SportstalentHealthConnect.kt`,
registered explicitly by `MainActivity`. There is **no npm package** - the old
`capacitor-health` / Capgo plugin was removed and must not be re-added.

Methods: `debugRegistration`, `isAvailable`, `requestAuthorization`,
`queryQuantity`, `queryWorkouts`. (`queryCategory` was removed with the sleep
permission.)

## 1. Prerequisites on the test device
1. Install **Health Connect** from the Play Store (pre-installed on Android 14+).
2. In Health Connect, grant your data sources (Wear OS watch, Fitbit, Samsung
   Health, Google Fit, etc.) permission to write **Exercise** and
   **Active calories**.

## 2. Manifest (already committed - do not re-add removed permissions)

```xml
<uses-permission android:name="android.permission.health.READ_EXERCISE" />
<uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />

<queries>
  <package android:name="com.google.android.apps.healthdata" />
  <intent>
    <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />
  </intent>
</queries>
```

Inside `<activity android:name=".MainActivity" ...>` there must be an
intent-filter for `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`, and an
`activity-alias` named `ViewPermissionUsageActivity` for Android 14+. Both are
already in place and are required by Play review.

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

