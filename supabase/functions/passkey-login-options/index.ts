// Issues authentication options for a passkey login.
// Public endpoint (no auth required) — but rate-limited per email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@10.0.1";
import { corsHeaders, RP_ID } from "../_shared/webauthn.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || "").toString().trim().toLowerCase();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit: max 5 challenges per email in last minute
    if (email) {
      const { count } = await admin
        .from("webauthn_challenges")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .eq("kind", "login")
        .gt("created_at", new Date(Date.now() - 60_000).toISOString());
      if ((count || 0) >= 5) {
        return json({ error: "Too many attempts. Try again in a minute." }, 429);
      }
    }

    // Look up user's passkeys (by email). If unknown email, still generate
    // options with empty allowCredentials to avoid email enumeration.
    let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] = [];

    if (email) {
      const { data: userRow } = await admin
        .schema("auth" as never)
        .from("users" as never)
        .select("id")
        .eq("email", email)
        .maybeSingle() as { data: { id: string } | null };

      if (userRow?.id) {
        const { data: keys } = await admin
          .from("user_passkeys")
          .select("credential_id, transports")
          .eq("user_id", userRow.id);
        allowCredentials = (keys || []).map((k) => ({
          id: k.credential_id,
          transports: (k.transports || undefined) as AuthenticatorTransport[] | undefined,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
      allowCredentials,
    });

    await admin.from("webauthn_challenges").insert({
      challenge: options.challenge,
      email: email || null,
      kind: "login",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return json({ options });
  } catch (e) {
    console.error("passkey-login-options error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
