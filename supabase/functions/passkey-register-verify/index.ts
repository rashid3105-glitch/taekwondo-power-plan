// Verifies the enrollment response from the browser and stores the public key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10.0.1";
import { corsHeaders, EXPECTED_ORIGINS, RP_ID } from "../_shared/webauthn.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const response = body?.response;
    const deviceLabel: string = (body?.deviceLabel || "Device").toString().slice(0, 80);
    if (!response?.id || !response?.response) return json({ error: "Invalid payload" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch matching challenge for this user
    const { data: challengeRow } = await admin
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("kind", "register")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challengeRow) return json({ error: "Challenge expired or not found" }, 400);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: EXPECTED_ORIGINS,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return json({ error: "Verification failed" }, 400);
    }

    const { credential } = verification.registrationInfo;
    const publicKeyB64 = btoa(String.fromCharCode(...credential.publicKey));

    // Enforce 5 passkeys per user
    const { count } = await admin
      .from("user_passkeys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count || 0) >= 5) {
      return json({ error: "Maximum of 5 passkeys reached. Remove one first." }, 400);
    }

    const { error: insertErr } = await admin.from("user_passkeys").insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: publicKeyB64,
      counter: credential.counter,
      transports: response.response.transports || null,
      device_label: deviceLabel,
      last_used_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error("insert passkey", insertErr);
      return json({ error: insertErr.message }, 500);
    }

    // Cleanup challenge
    await admin.from("webauthn_challenges").delete().eq("id", challengeRow.id);

    return json({ success: true });
  } catch (e) {
    console.error("passkey-register-verify error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
