// Native (iOS + Android) push notifications via Firebase Cloud Messaging.

import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

type NavigateFn = (path: string) => void;

let externalNavigate: NavigateFn | null = null;
let listenersBound = false;
let registeringPushToken = false;

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
    // ignore
  }
}

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function currentPlatform(): "ios" | "android" {
  try {
    return Capacitor.getPlatform() === "ios" ? "ios" : "android";
  } catch {
    return "android";
  }
}

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
      .update({
        is_active: true,
        last_seen_at: now,
        platform,
      })
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

async function bindListenersOnce(userId: string) {
  if (listenersBound) return;

  listenersBound = true;

  // Token refreshed
  await FirebaseMessaging.addListener(
    "tokenReceived",
    async (event: any) => {
      try {
        const token = event?.token;

        console.log("🔄 Token refreshed");
        console.log(token);

        if (token && userId) {
          await saveToken(userId, token);
        }
      } catch (e) {
        console.error("❌ tokenReceived failed");
        console.error(e);
      }
    }
  );

  // Foreground notification
  await FirebaseMessaging.addListener(
    "notificationReceived",
    (event: any) => {
      console.log("📩 Notification received");
      console.log(event);
    }
  );

  // User tapped notification
  await FirebaseMessaging.addListener(
    "notificationActionPerformed",
    (event: any) => {

      console.log("👉 Notification tapped");
      console.log(event);

      const data = event?.notification?.data || {};
      const type = data.type as string | undefined;

      try {

        if (type === "chat" && data.thread_id) {
          navigateTo(
            `/messages?thread=${encodeURIComponent(
              String(data.thread_id)
            )}`
          );
          return;
        }
if (type === "diary" && data.athlete_id) {
  navigateTo(
    `/coach/athlete/${encodeURIComponent(String(data.athlete_id))}?diary=1`
  );
  return;
}

if (type === "competition_reflection" && data.athlete_id) {
  navigateTo(
    `/coach/athlete/${encodeURIComponent(String(data.athlete_id))}`
  );
  return;
}
          return;
        }

        navigateTo("/dashboard");

      } catch {

        navigateTo("/dashboard");

      }
    }
  );
}
export async function registerPushToken(userId: string): Promise<void> {
    if (registeringPushToken) {
    return;
  }

  registeringPushToken = true;

  console.log("========================================");
  console.log("🚀 registerPushToken()");
  console.log("Platform:", Capacitor.getPlatform());
  console.log("User ID:", userId);
  console.log("========================================");

  if (!isNative()) {
    console.log("❌ Not running on a native platform");
    return;
  }

  if (!userId) {
    console.log("❌ Missing user id");
    return;
  }

  try {

    console.log("📱 Requesting notification permission...");

    const permission = await FirebaseMessaging.requestPermissions();

    console.log("Permission result:");
    console.log(permission);

    if (permission.receive !== "granted") {
      console.log("❌ Notification permission denied");
      return;
    }

    console.log("✅ Notification permission granted");

    console.log("🎫 Requesting FCM token...");

    const result = await FirebaseMessaging.getToken();

    console.log("🔥 FCM TOKEN");
    console.log(result.token);

    if (!result.token) {
      console.log("❌ Firebase returned an empty token");
      return;
    }

    console.log("💾 Saving token...");

    await saveToken(userId, result.token);

    console.log("👂 Binding listeners...");

    await bindListenersOnce(userId);

    console.log("✅ Push registration completed");

  } catch (error: any) {

  console.error("ERROR NAME:", error?.name);
  console.error("ERROR MESSAGE:", error?.message);
  console.error("ERROR STACK:", error?.stack);
  console.error(error);

} finally {

  registeringPushToken = false;

}

}