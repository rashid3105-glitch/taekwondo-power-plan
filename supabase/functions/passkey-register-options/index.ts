// Issues registration options for enrolling a new passkey on the current device.
// Requires an authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10.0.1";
import { corsHeaders, RP_ID, RP_NAME } from "../_shared/webauthn.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string) || "athlete";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Existing passkeys to exclude (so the same device can't enroll twice)
    const { data: existing } = await admin
      .from("user_passkeys")
      .select("credential_id, transports")
      .eq("user_id", userId);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(userId),
      userName: email,
      userDisplayName: email,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // Face ID / Touch ID / Windows Hello
      },
      excludeCredentials: (existing || []).map((c) => ({
        id: c.credential_id,
        transports: (c.transports || []) as AuthenticatorTransport[],
      })),
    });

    // Persist challenge for verify step
    await admin.from("webauthn_challenges").insert({
      challenge: options.challenge,
      user_id: userId,
      kind: "register",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return json({ options });
  } catch (e) {
    console.error("passkey-register-options error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
