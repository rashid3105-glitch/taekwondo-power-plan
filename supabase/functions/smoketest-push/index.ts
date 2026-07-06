// TEMPORARY smoke-test harness for send-push. DELETE after use.
// Guarded by SMOKETEST_TOKEN header. Invokes send-push via service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

Deno.serve(async (req) => {
  const t = req.headers.get("x-smoketest-token");
  if (!t || t !== Deno.env.get("SMOKETEST_TOKEN")) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const body = await req.json();
  const { data, error } = await admin.functions.invoke("send-push", { body });
  return new Response(JSON.stringify({ data, error: error?.message ?? null }), {
    headers: { "Content-Type": "application/json" },
  });
});
