// Firebase Cloud Messaging (HTTP v1) helper.
// Reads credentials from the FIREBASE_SERVICE_ACCOUNT secret (raw JSON string).
// Never hardcode credentials in this file.
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
};

let cachedToken: { token: string; exp: number } | null = null;
let cachedAccount: ServiceAccount | null = null;

function loadServiceAccount(): ServiceAccount {
  if (cachedAccount) return cachedAccount;
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not set");
  const acc = JSON.parse(raw) as ServiceAccount;
  if (!acc.client_email || !acc.private_key || !acc.project_id) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is missing required fields");
  }
  cachedAccount = acc;
  return acc;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8", der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"],
  );
}

export async function getFcmAccessToken(): Promise<{ token: string; projectId: string }> {
  const acc = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return { token: cachedToken.token, projectId: acc.project_id };
  }

  const key = await importPrivateKey(acc.private_key);
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: acc.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: acc.token_uri || "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    key,
  );

  const res = await fetch(acc.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`FCM token exchange failed: ${res.status} ${txt}`);
  }
  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, exp: now + data.expires_in };
  return { token: data.access_token, projectId: acc.project_id };
}

export type FcmSendResult = { ok: boolean; unregistered?: boolean; error?: string };

export async function sendFcmMessage(params: {
  accessToken: string;
  projectId: string;
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  url?: string;
}): Promise<FcmSendResult> {
  const { accessToken, projectId, token, title, body, data, url } = params;
  const message: any = {
    token,
    notification: { title, body },
    data: {
      ...(data || {}),
      ...(url ? { url } : {}),
    },
    // Ensure keys are strings for FCM
    android: { priority: "HIGH" },
    apns: { payload: { aps: { sound: "default", "content-available": 1 } } },
    webpush: url ? { fcm_options: { link: url } } : undefined,
  };
  // FCM requires all data values to be strings
  if (message.data) {
    for (const k of Object.keys(message.data)) message.data[k] = String(message.data[k]);
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );
  if (res.ok) {
    await res.text();
    return { ok: true };
  }
  const errTxt = await res.text();
  let code = "";
  try {
    const j = JSON.parse(errTxt);
    code = j?.error?.details?.[0]?.errorCode || j?.error?.status || "";
  } catch { /* ignore */ }
  const unregistered = code === "UNREGISTERED" || code === "NOT_FOUND"
    || res.status === 404 || errTxt.includes("registration-token-not-registered");
  return { ok: false, unregistered, error: `${res.status} ${code || errTxt.slice(0, 200)}` };
}
