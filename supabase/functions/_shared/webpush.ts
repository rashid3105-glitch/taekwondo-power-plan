// Web Push (VAPID / aes128gcm) sender for browser subscriptions.
//
// Native apps (iOS/Android) are delivered via FCM; browsers store a standard
// PushSubscription (endpoint + p256dh + auth) in public.push_subscriptions and
// are delivered here.
import webpush from "npm:web-push@3.6.7";

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const pub = Deno.env.get("VAPID_PUBLIC_KEY");
  const priv = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@sportstalent.dk";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
  tag?: string;
}

export async function sendWebPush(
  sub: WebPushSubscription,
  payload: WebPushPayload,
): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!configure()) return { ok: false, error: "vapid_not_configured" };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true };
  } catch (e) {
    const status = (e as any)?.statusCode;
    // 404 / 410 => subscription no longer valid, deactivate it.
    if (status === 404 || status === 410) return { ok: false, gone: true };
    return { ok: false, error: `${status ?? ""} ${(e as Error).message}`.trim() };
  }
}
