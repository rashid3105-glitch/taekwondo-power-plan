import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USER_ID = "b430750e-7ad9-4f36-a2c3-326670ff86ea";
const EMAIL = "demo.emma@sportstalent.dk";
const PASSWORD = "DemoEmma2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const steps: Record<string, unknown> = {};

  // 1. Does an auth user already exist with this id?
  const { data: got } = await supa.auth.admin.getUserById(USER_ID);
  let email = got?.user?.email ?? null;

  if (!got?.user) {
    // 2. Try creating an auth user WITH the existing profile id via the admin REST API
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      },
      body: JSON.stringify({
        id: USER_ID,
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "Demo Athlete – Emma" },
      }),
    });
    const json = await res.json();
    steps.create_status = res.status;
    steps.create_body = json;
    if (!res.ok) {
      return new Response(JSON.stringify(steps), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    email = json.email;
    steps.created_id = json.id;
  } else {
    const { error: updErr } = await supa.auth.admin.updateUserById(USER_ID, {
      password: PASSWORD,
      email_confirm: true,
    });
    steps.update_error = updErr?.message ?? null;
  }

  // 3. Make sure exactly one profile row exists for this id (the seeded Emma one)
  const { data: profs } = await supa
    .from("profiles")
    .select("user_id, display_name")
    .eq("user_id", USER_ID);
  steps.profiles = profs;

  // 4. Verify sign in
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { error: signErr } = await anon.auth.signInWithPassword({
    email: email!,
    password: PASSWORD,
  });

  return new Response(
    JSON.stringify({ ...steps, email, password: PASSWORD, signin_ok: !signErr, signin_error: signErr?.message ?? null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
