// Frontend helper for WebAuthn (passkeys / Face ID / Touch ID).
// Wraps @simplewebauthn/browser and the four passkey edge functions.

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";

export function passkeysSupported(): boolean {
  try {
    return browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

export async function platformAuthenticatorAvailable(): Promise<boolean> {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

/**
 * Enroll a new passkey for the currently signed-in user.
 * Triggers the OS biometric prompt (Face ID / Touch ID / Windows Hello).
 */
export async function enrollPasskey(deviceLabel?: string): Promise<void> {
  const optsRes = await supabase.functions.invoke("passkey-register-options");
  if (optsRes.error) throw new Error(optsRes.error.message);
  const { options } = optsRes.data as { options: any };

  const attResp = await startRegistration(options);

  const verifyRes = await supabase.functions.invoke("passkey-register-verify", {
    body: { response: attResp, deviceLabel: deviceLabel || guessDeviceLabel() },
  });
  if (verifyRes.error) throw new Error(verifyRes.error.message);
  const data = verifyRes.data as { success?: boolean; error?: string };
  if (!data.success) throw new Error(data.error || "Enrollment failed");
}

/**
 * Sign in with a passkey. If `email` is provided, narrows the credential list.
 * Establishes a real Supabase session on success.
 */
export async function signInWithPasskey(email?: string): Promise<void> {
  const optsRes = await supabase.functions.invoke("passkey-login-options", {
    body: { email },
  });
  if (optsRes.error) throw new Error(optsRes.error.message);
  const { options } = optsRes.data as { options: any };

  const assertion = await startAuthentication(options);

  const verifyRes = await supabase.functions.invoke("passkey-login-verify", {
    body: { response: assertion },
  });
  if (verifyRes.error) throw new Error(verifyRes.error.message);
  const data = verifyRes.data as { email?: string; hashed_token?: string; error?: string };
  if (!data.email || !data.hashed_token) {
    throw new Error(data.error || "Login failed");
  }

  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    email: data.email,
    token_hash: data.hashed_token,
  });
  if (error) throw error;
}

function guessDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Mac/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "Device";
}
