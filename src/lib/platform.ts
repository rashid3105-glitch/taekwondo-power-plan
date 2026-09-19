// Platform detection helpers.
//
// The app is compiled into two shipping targets:
//   1. Web (sportstalent.dk) — full functionality, including Stripe checkout
//      and the customer portal.
//   2. Native iOS / Android (Capacitor) — App Store / Google Play compliance
//      requires that the app must not offer purchases nor point users to
//      any external payment flow.
//
// Every place that renders a purchase / pricing / upgrade CTA — or that
// navigates to /pricing or the Stripe portal — must gate that UI behind
// `!isNativeApp()`. Access control itself (subscriptions, club licence,
// demo_full_access) is decided server-side and is untouched by this helper.

import { Capacitor } from "@capacitor/core";

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Public web origin. Inside the native app `window.location.origin` is
// `capacitor://localhost`, which is unusable in any link shared with people
// outside the app (guardian invites, share links). Always build such links
// with this helper.
export const PUBLIC_APP_URL = "https://sportstalent.dk";

export function publicAppOrigin(): string {
  if (isNativeApp()) return PUBLIC_APP_URL;
  if (typeof window === "undefined") return PUBLIC_APP_URL;
  const origin = window.location.origin;
  if (!origin || !/^https?:$/.test(window.location.protocol)) return PUBLIC_APP_URL;
  return origin;
}
