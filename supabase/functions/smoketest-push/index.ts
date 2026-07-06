// TEMPORARY smoke-test harness for send-push. DELETE after use.
// Guarded by SMOKETEST_TOKEN header. Calls send-push directly via fetch so
// we can see the raw status + body from send-push.
Deno.serve(async (req) => {
  const t = req.headers.get("x-smoketest-token");
  if (!t || t !== Deno.env.get("SMOKETEST_TOKEN")) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const body = await req.text();
  const r = await fetch(`${url}/functions/v1/send-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body,
  });
  const respText = await r.text();
  return new Response(JSON.stringify({ status: r.status, body: respText }), {
    headers: { "Content-Type": "application/json" },
  });
});
