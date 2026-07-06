// Sends push notifications via Firebase Cloud Messaging (HTTP v1).
//
// LOCKED DOWN: this function is service-role ONLY. Regular user JWTs are
// rejected. Client-facing flows (chat, diary) go through dedicated wrapper
// functions (notify-chat-message, notify-diary-activity) which validate the
// caller and then invoke this function using the service role.
//
// Input:
//   {
//     user_ids: string[]   // recipient user ids
//     title:    string
//     body:     string
//     data?:    Record<string,string>
//     url?:     string     // internal app path, must start with "/"
//   }
//
// Behaviour:
//   - Reads active FCM tokens from public.push_subscriptions.
//   - Sends one FCM v1 request per token.
//   - Marks tokens is_active=false when FCM reports UNREGISTERED / NOT_FOUND.
//   - Respects profiles.push_enabled (default true).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";
import { getFcmAccessToken, sendFcmMessage } from "../_shared/fcm.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Accept & ignore legacy fields (category, tag) from older callers.
const Body = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(500),
  title: z.string().min(1).max(120),
  body: z.string().max(400).default(""),
  data: z.record(z.string()).optional(),
  url: z.string().max(300).default("/dashboard").refine(
    (u) => /^\/[A-Za-z0-9\-_/?=&%.#]*$/.test(u) && !u.startsWith("//"),
    { message: "url must be an internal app path" },
  ),
  category: z.string().optional(),
  tag: z.string().optional(),
}).passthrough();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ---- Service-role only ---------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.slice(7).trim();

    // Reject anon/publishable key
    if (token === ANON_KEY) return json({ error: "Forbidden" }, 403);

    // Verify caller is service role. We call getUser with the token; service
    // role tokens return a user with role === 'service_role'. User JWTs are
    // rejected here — clients must use the wrapper functions instead.
    const supaCheck = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supaCheck.auth.getUser(token);
    const callerRole = (userData?.user as any)?.role;
    if (callerRole !== "service_role") {
      return json({ error: "Forbidden — service role required" }, 403);
    }

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { user_ids, title, body, data, url } = parsed.data;

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);

    // Filter recipients by push_enabled preference
    const { data: profs } = await supa.from("profiles")
      .select("user_id, push_enabled").in("user_id", user_ids);
    const enabled = new Set(
      (profs || []).filter((p: any) => p.push_enabled !== false).map((p: any) => p.user_id),
    );
    // Default to enabled when no profile row exists
    const targets = user_ids.filter((id) => enabled.has(id) || !profs?.find((p: any) => p.user_id === id));
    if (targets.length === 0) return json({ sent: 0, reason: "opted_out" });

    const { data: subs } = await supa.from("push_subscriptions")
      .select("id, fcm_token")
      .in("user_id", targets)
      .eq("is_active", true)
      .not("fcm_token", "is", null);
    if (!subs?.length) return json({ sent: 0, reason: "no_tokens" });

    const { token: accessToken, projectId } = await getFcmAccessToken();

    let sent = 0;
    const dead: string[] = [];
    await Promise.all(subs.map(async (s: any) => {
      const r = await sendFcmMessage({
        accessToken, projectId, token: s.fcm_token,
        title, body, data, url,
      });
      if (r.ok) sent++;
      else if (r.unregistered) dead.push(s.id);
      else console.error("fcm send error", { id: s.id, err: r.error });
    }));

    if (dead.length) {
      await supa.from("push_subscriptions")
        .update({ is_active: false })
        .in("id", dead);
    }

    return json({ sent, deactivated: dead.length });
  } catch (e) {
    console.error("send-push error", e);
    return json({ error: (e as Error).message || "server_error" }, 500);
  }
});
