// Verifies a passkey assertion and returns a Supabase session for the user.
// Uses generateLink (magiclink) under the service role and returns the
// hashed_token + email so the client can finalize the session via verifyOtp.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10.0.1";
import { corsHeaders, EXPECTED_ORIGINS, RP_ID } from "../_shared/webauthn.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const response = body?.response;
    if (!response?.id || !response?.response) return json({ error: "Invalid payload" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the passkey by credential_id
    const { data: passkey } = await admin
      .from("user_passkeys")
      .select("*")
      .eq("credential_id", response.id)
      .maybeSingle();

    if (!passkey) return json({ error: "Unknown passkey" }, 404);

    // Get the latest matching login challenge.
    // We accept either (email-bound) or (anonymous) challenges within TTL.
    const { data: challengeRow } = await admin
      .from("webauthn_challenges")
      .select("*")
      .eq("kind", "login")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (!challengeRow || challengeRow.length === 0) {
      return json({ error: "Challenge expired" }, 400);
    }

    // Find a challenge that was either anonymous or for this user's email.
    const { data: userRecord } = await admin.auth.admin.getUserById(passkey.user_id);
    const userEmail = userRecord?.user?.email?.toLowerCase() || null;
    const matched = challengeRow.find(
      (c) => !c.email || (userEmail && c.email === userEmail),
    );
    if (!matched) return json({ error: "Challenge mismatch" }, 400);

    const publicKeyBytes = Uint8Array.from(atob(passkey.public_key), (c) => c.charCodeAt(0));

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: matched.challenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.credential_id,
        publicKey: publicKeyBytes,
        counter: Number(passkey.counter),
        transports: passkey.transports || undefined,
      },
    });

    if (!verification.verified) return json({ error: "Verification failed" }, 401);

    // Update counter + last_used + cleanup challenge
    await admin
      .from("user_passkeys")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", passkey.id);

    await admin.from("webauthn_challenges").delete().eq("id", matched.id);

    if (!userEmail) return json({ error: "User email missing" }, 500);

    // Generate a magic-link token to bridge into a real Supabase session
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("generateLink", linkErr);
      return json({ error: "Failed to issue session" }, 500);
    }

    return json({
      email: userEmail,
      hashed_token: linkData.properties.hashed_token,
    });
  } catch (e) {
    console.error("passkey-login-verify error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
