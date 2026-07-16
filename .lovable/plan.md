## Plan

Fix the native push loop by making push registration idempotent and separating token refresh from full registration.

### What I will change
1. **`src/lib/nativePush.ts`**
   - Add a persistent in-memory guard keyed by `userId + token`, so the same token is not repeatedly re-registered in the same app session.
   - Bind Firebase listeners only once globally.
   - Change `tokenReceived` so it only saves the refreshed token instead of causing another full permission/token registration cycle.
   - Ensure `registeringPushToken` is reset correctly even when native/platform checks return early.
   - Reduce noisy token logging so device tokens are not printed repeatedly.

2. **`src/App.tsx`**
   - Keep automatic startup registration, but make it safe by relying on the new idempotent guard.
   - Optionally tighten the effect so it does not re-register due to route/navigation remount behavior.

3. **`src/pages/Auth.tsx` and `src/pages/Profile.tsx`**
   - Keep explicit login/profile-triggered registration, but route through the safer idempotent registration flow.
   - No UI changes.

### Expected result
- On native app startup/login, the log should show only one full `registerPushToken()` cycle.
- `tokenReceived` may still appear, but it should only update/save the token and must not trigger repeated `requestPermissions` + `getToken` calls.
- The unrelated warnings (`UIScene`, Firebase swizzling, sandbox extension, HealthKit UNIMPLEMENTED) are not the cause of the push loop and will not be changed in this fix.

### After implementation
You will need to git pull the project, run `npx cap sync`, then rebuild/run from Xcode on the device.