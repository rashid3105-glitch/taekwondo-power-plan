import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const code = String(body.code || "").trim();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");

    if (!code || !firstName || !lastName || !phone) {
      return json({ error: "missing_fields" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "invalid_email" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "weak_password" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1. Validate invite
    const { data: invite, error: invErr } = await admin
      .from("parent_invites")
      .select("id, athlete_id, used_at, expires_at")
      .eq("code", code)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (invErr) return json({ error: invErr.message }, 500);
    if (!invite) return json({ error: "invalid_or_expired" }, 400);

    const displayName = `${firstName} ${lastName}`.trim();

    // 2. Create auth user (auto-confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        phone,
        is_parent: true,
      },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message || "signup_failed" }, 400);
    }
    const userId = created.user.id;

    // 3. Upsert profile (handle_new_user trigger may have inserted a row)
    const { error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          display_name: displayName,
          phone,
          is_parent: true,
          is_approved: true,
          onboarding_completed: true,
        },
        { onConflict: "user_id" },
      );
    if (profErr) return json({ error: profErr.message }, 500);

    // 4. Mark invite used and link parent_athletes
    await admin
      .from("parent_invites")
      .update({ used_at: new Date().toISOString(), parent_user_id: userId })
      .eq("id", invite.id);

    await admin
      .from("parent_athletes")
      .insert({ parent_user_id: userId, athlete_id: invite.athlete_id });

    return json({ ok: true, athlete_id: invite.athlete_id });
  } catch (e) {
    return json({ error: (e as Error).message || "unexpected_error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
