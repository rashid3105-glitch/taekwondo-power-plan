// Native (iOS + Android) push notifications via Firebase Cloud Messaging.
//
// Uses @capacitor-firebase/messaging. All calls are guarded by
// Capacitor.isNativePlatform() so this file is a full no-op in the browser /
// Lovable preview — web push continues to run through pushNotifications.ts.
//
// Called from:
//   - Auth.tsx after a successful sign-in                → registerPushToken()
//   - ConsentGate.tsx on app start when a session exists → registerPushToken()
//   - Profile / GlobalAppMenu just before signOut()      → unregisterPushToken()
//
// Notification payload contract (matches notify-chat-message /
// notify-coaches-athlete-activity):
//   data.type === "chat"   + data.thread_id
//   data.type === "diary"  + data.athlete_id
//   data.type === "competition_reflection" + data.athlete_id
//
// UX intentionally avoids requesting permission before login — the OS prompt
// has one shot at "Allow"; asking it after the user is inside the app has a
// much higher grant rate.

import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

type NavigateFn = (path: string) => void;
let externalNavigate: NavigateFn | null = null;
let listenersBound = false;

/** Register a router-aware navigator so notification taps stay in-app. */
export function setPushNavigator(fn: NavigateFn | null) {
  externalNavigate = fn;
}

function navigateTo(path: string) {
  try {
    if (externalNavigate) {
      externalNavigate(path);
    } else {
      window.location.assign(path);
    }
  } catch {
    /* ignore */
  }
}

function isNative(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

function currentPlatform(): "ios" | "android" {
  try { return Capacitor.getPlatform() === "ios" ? "ios" : "android"; } catch { return "android"; }
}

/** Upsert the token row keyed on (user_id, fcm_token). The table has no
 * unique constraint on that pair, so we do it manually: look up, then
 * update the timestamp / reactivate, else insert. */
async function saveToken(userId: string, token: string) {
  const platform = currentPlatform();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("fcm_token", token)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("push_subscriptions")
      .update({ is_active: true, last_seen_at: now, platform })
      .eq("id", existing.id);
  } else {
    await supabase.from("push_subscriptions").insert({
      user_id: userId,
      fcm_token: token,
      platform,
      is_active: true,
      last_seen_at: now,
    });
  }
}

/** Lazy dynamic import so the module never touches the web bundle. */
async function loadMessaging() {
  const mod = await import("@capacitor-firebase/messaging");
  return mod.FirebaseMessaging;
}

async function bindListenersOnce(userId: string) {
  if (listenersBound) return;
  listenersBound = true;

  const FirebaseMessaging = await loadMessaging();

  // Token refresh
  await FirebaseMessaging.addListener("tokenReceived", async (event: any) => {
    try {
      const t = event?.token;
      if (t && userId) await saveToken(userId, t);
    } catch (e) {
      console.warn("[push] tokenReceived failed", e);
    }
  });

  // Foreground: intentionally no-op. The app's own unread badges / chat list
  // already surface the new item; adding a toast would be a duplicate.
  await FirebaseMessaging.addListener("notificationReceived", () => {
    /* no-op */
  });

  // Tap on a notification (background / cold-start)
  await FirebaseMessaging.addListener(
    "notificationActionPerformed",
    (event: any) => {
      const data = event?.notification?.data || {};
      const type = data.type as string | undefined;
      try {
        if (type === "chat" && data.thread_id) {
          navigateTo(`/messages?thread=${encodeURIComponent(String(data.thread_id))}`);
          return;
        }
        if (type === "diary" && data.athlete_id) {
          navigateTo(`/coach/athlete/${encodeURIComponent(String(data.athlete_id))}?diary=1`);
          return;
        }
        if (type === "competition_reflection" && data.athlete_id) {
          navigateTo(`/coach/athlete/${encodeURIComponent(String(data.athlete_id))}`);
          return;
        }
        navigateTo("/dashboard");
      } catch {
        navigateTo("/dashboard");
      }
    },
  );
}

/**
 * Ask for OS permission, obtain an FCM token and persist it. Silent no-op
 * on the web or when permission is denied — never throws.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (!isNative() || !userId) return;

  try {
    const FirebaseMessaging = await loadMessaging();

    const perm = await FirebaseMessaging.requestPermissions();
    if (perm.receive !== "granted") return;

    const { token } = await FirebaseMessaging.getToken();
    if (!token) return;

    await saveToken(userId, token);
    await bindListenersOnce(userId);
  } catch (e) {
    console.warn("[push] registerPushToken failed", e);
  }
}

/**
 * Called on sign-out. Deactivates the current device's token so the backend
 * stops sending to it. Best-effort — never throws.
 */
export async function unregisterPushToken(userId: string): Promise<void> {
  if (!isNative() || !userId) return;
  try {
    const FirebaseMessaging = await loadMessaging();
    let token: string | null = null;
    try {
      const res = await FirebaseMessaging.getToken();
      token = res?.token ?? null;
    } catch {
      /* token may already be gone — try deactivating all rows for the user */
    }
    const q = supabase
      .from("push_subscriptions")
      .update({ is_active: false })
      .eq("user_id", userId);
    if (token) {
      await q.eq("fcm_token", token);
    } else {
      await q.not("fcm_token", "is", null);
    }
  } catch (e) {
    console.warn("[push] unregisterPushToken failed", e);
  }
}
