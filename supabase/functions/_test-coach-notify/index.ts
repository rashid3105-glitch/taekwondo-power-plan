// TEMP test function — invokes notify-coaches-athlete-activity as Son of Farooq.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(url, service);

  const SON_ID = "3228381e-0fac-430d-84ab-d91eb6949e8b";
  const log: any = {};

  // 1. Get Son's email
  const { data: u } = await admin.auth.admin.getUserById(SON_ID);
  const sonEmail = u?.user?.email;
  log.sonEmail = sonEmail;

  // 2. Insert diary entry
  const today = new Date().toISOString().slice(0, 10);
  const { data: diary, error: dErr } = await admin.from("diary_entries").insert({
    user_id: SON_ID,
    entry_date: today,
    entry_type: "general",
    title: "E2E test diary",
    content: "Testing coach notification flow",
    mood: 4,
    energy: 4,
  }).select("id").single();
  log.diary = diary;
  log.diaryErr = dErr?.message;

  // 3. Mint a session for Son via magic link
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: sonEmail!,
  });
  if (linkErr) {
    log.linkErr = linkErr.message;
    return new Response(JSON.stringify(log), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const hashed = link.properties?.hashed_token!;
  const userClient = createClient(url, anon);
  const { data: sess, error: vErr } = await userClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: hashed,
  });
  if (vErr || !sess.session) {
    log.verifyErr = vErr?.message;
    return new Response(JSON.stringify(log), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const accessToken = sess.session.access_token;
  log.tokenUser = sess.user?.email;

  // 4. Call notify-coaches-athlete-activity
  const resp = await fetch(`${url}/functions/v1/notify-coaches-athlete-activity`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "apikey": anon,
    },
    body: JSON.stringify({ activity_type: "diary" }),
  });
  log.notifyStatus = resp.status;
  log.notifyBody = await resp.text();

  return new Response(JSON.stringify(log, null, 2), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
