// TODO(fcm-native): wire this up with @capacitor-firebase/messaging in the
// native client rollout. This is a stub placeholder so the code path is
// visible; it is intentionally NOT called anywhere yet.
//
// Planned shape:
//   1. request notification permission
//   2. get FCM registration token from @capacitor-firebase/messaging
//   3. upsert into public.push_subscriptions with:
//        { user_id, platform: 'ios' | 'android', fcm_token, is_active: true }
//   4. subscribe to onTokenRefresh and re-upsert
//   5. on sign-out: mark rows is_active = false for this device.
import { Capacitor } from "@capacitor/core";

export function isNativePushSupported(): boolean {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android";
}

export async function registerNativePush(): Promise<{ ok: boolean; reason?: string }> {
  return { ok: false, reason: "not_implemented" };
}
