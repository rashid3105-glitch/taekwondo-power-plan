import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USER_ID = "b430750e-7ad9-4f36-a2c3-326670ff86ea";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: got, error: getErr } = await supa.auth.admin.getUserById(USER_ID);
  if (getErr) {
    return new Response(JSON.stringify({ step: "get", error: getErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const password = "DemoEmma2026!";
  const { error: updErr } = await supa.auth.admin.updateUserById(USER_ID, {
    password,
    email_confirm: true,
  });
  if (updErr) {
    return new Response(JSON.stringify({ step: "update", error: updErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify sign-in works
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { error: signErr } = await anon.auth.signInWithPassword({
    email: got.user!.email!,
    password,
  });

  return new Response(
    JSON.stringify({
      email: got.user!.email,
      password,
      signin_ok: !signErr,
      signin_error: signErr?.message ?? null,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
