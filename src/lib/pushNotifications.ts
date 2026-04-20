import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (safe to expose to client)
export const VAPID_PUBLIC_KEY =
  "BJT9xXV7KGVbpKYBGtqNRpxDwZJxBvxhm2I4X5lHEDpaw-trdERdy2LppMAIWyjUKyzJ0oj1WnHMWXE_Lulh6_c";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  // Avoid registering inside Lovable preview iframes
  const isPreview = location.hostname.includes("id-preview--") || location.hostname.includes("lovableproject.com");
  if (isPreview) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.error("SW register failed", e);
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const reg = await registerSW();
  if (!reg) return false;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const json = sub.toJSON() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent.slice(0, 200),
  }, { onConflict: "user_id,endpoint" });

  return !error;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
    }
  }
}

export async function getCurrentSubscriptionStatus(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return !!sub;
}
