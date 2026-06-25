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
    if (invErr) { console.error("parent-signup invite lookup error", invErr); return json({ error: "server_error" }, 500); }
    if (!invite) return json({ error: "invalid_or_expired" }, 400);

    const displayName = `${firstName} ${lastName}`.trim();

    // 2. Create auth user (auto-confirmed). If already exists, recover.
    let userId: string | null = null;
    let createdNow = false;
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

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      const alreadyExists = msg.includes("already") || msg.includes("registered");
      if (!alreadyExists) {
        console.error("parent-signup createUser error", createErr);
        return json({ error: "signup_failed" }, 400);
      }
      // Recovery: find existing user by email
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listErr) { console.error("parent-signup listUsers error", listErr); return json({ error: "server_error" }, 500); }
      const existing = list?.users?.find((u) => (u.email || "").toLowerCase() === email);
      if (!existing) return json({ error: "already_registered" }, 400);
      // Verify the password matches before re-using the account
      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { auth: { persistSession: false } },
      );
      const { error: signInErr } = await anonClient.auth.signInWithPassword({ email, password });
      if (signInErr) return json({ error: "already_registered" }, 400);
      userId = existing.id;
    } else {
      userId = created.user.id;
      createdNow = true;
    }

    // 3. Upsert profile (no `phone` column on profiles — phone lives in user_metadata)
    const { error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          display_name: displayName,
          is_parent: true,
          is_approved: true,
          onboarding_completed: true,
        },
        { onConflict: "user_id" },
      );
    if (profErr) {
      if (createdNow && userId) {
        try { await admin.auth.admin.deleteUser(userId); } catch {}
      }
      console.error("parent-signup profile upsert error", profErr);
      return json({ error: "server_error" }, 500);
    }

    // 4. Mark invite used and link parent_athletes
    const { error: invUpdErr } = await admin
      .from("parent_invites")
      .update({ used_at: new Date().toISOString(), parent_user_id: userId })
      .eq("id", invite.id);
    if (invUpdErr) {
      if (createdNow && userId) {
        try { await admin.auth.admin.deleteUser(userId); } catch {}
      }
      console.error("parent-signup invite update error", invUpdErr);
      return json({ error: "server_error" }, 500);
    }

    const { error: linkErr } = await admin
      .from("parent_athletes")
      .upsert(
        { parent_user_id: userId, athlete_id: invite.athlete_id },
        { onConflict: "parent_user_id,athlete_id", ignoreDuplicates: true },
      );
    if (linkErr) return json({ error: linkErr.message }, 500);

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
