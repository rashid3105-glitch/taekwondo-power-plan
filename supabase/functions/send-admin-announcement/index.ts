// Admin broadcast: creates an in-app announcement for selected users/clubs
// and sends a push notification to them.
//
// Admin-only. Input:
//   { title, body, link_url?, audience: 'all'|'clubs'|'users',
//     club_ids?: string[], user_ids?: string[] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  link_url: z.string().max(300).optional().nullable(),
  audience: z.enum(["all", "clubs", "users"]),
  club_ids: z.array(z.string().uuid()).max(200).optional().default([]),
  user_ids: z.array(z.string().uuid()).max(2000).optional().default([]),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { title, body, link_url, audience, club_ids, user_ids } = parsed.data;

    const linkPath = link_url && /^\/[A-Za-z0-9\-_/?=&%.#]*$/.test(link_url) && !link_url.startsWith("//")
      ? link_url
      : "/dashboard";

    // ---- Resolve recipients -------------------------------------------
    let recipients: string[] = [];
    if (audience === "users") {
      recipients = user_ids;
    } else {
      let q = admin.from("profiles").select("user_id").eq("is_approved", true);
      if (audience === "clubs") {
        if (!club_ids.length) return json({ error: "club_ids required" }, 400);
        q = q.in("club_id", club_ids);
      }
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      recipients = (data ?? []).map((r: any) => r.user_id);
    }
    recipients = Array.from(new Set(recipients.filter(Boolean)));
    if (!recipients.length) return json({ error: "no_recipients" }, 400);

    // ---- Persist announcement -----------------------------------------
    const { data: ann, error: annError } = await admin
      .from("admin_announcements")
      .insert({
        title,
        body,
        link_url: linkPath,
        audience,
        club_ids: audience === "clubs" ? club_ids : [],
        sent_by: user.id,
        recipient_count: recipients.length,
      })
      .select("id")
      .single();
    if (annError || !ann) return json({ error: annError?.message ?? "insert_failed" }, 500);

    for (let i = 0; i < recipients.length; i += 500) {
      const rows = recipients.slice(i, i + 500).map((rid) => ({
        announcement_id: ann.id,
        recipient_id: rid,
      }));
      const { error } = await admin.from("admin_announcement_recipients").insert(rows);
      if (error) console.error("recipient insert failed", error.message);
    }

    // ---- Push notification --------------------------------------------
    let pushed = 0;
    for (let i = 0; i < recipients.length; i += 400) {
      const chunk = recipients.slice(i, i + 400);
      const { error } = await admin.functions.invoke("send-push", {
        body: {
          user_ids: chunk,
          title,
          body: body.slice(0, 200),
          url: linkPath,
          data: { announcement_id: ann.id },
        },
      });
      if (error) console.error("send-push failed", error.message);
      else pushed += chunk.length;
    }

    return json({ ok: true, announcement_id: ann.id, recipients: recipients.length, pushed });
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
