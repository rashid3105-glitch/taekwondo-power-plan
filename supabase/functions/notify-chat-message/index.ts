// Called by the app when a chat message has just been created.
// Validates the caller is a member of the thread, then sends a push to the
// other thread members in their preferred language via send-push (service role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";
import { normalizeLocale, t } from "../_shared/pushI18n.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  thread_id: z.string().uuid(),
  preview: z.string().max(200).optional(),
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.slice(7).trim();

    const supaUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: uData, error: uErr } = await supaUser.auth.getUser(token);
    if (uErr || !uData?.user) return json({ error: "Unauthorized" }, 401);
    const senderId = uData.user.id;

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const { thread_id, preview } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Confirm sender is a member of the thread
    const { data: senderMember } = await admin.from("chat_thread_members")
      .select("user_id").eq("thread_id", thread_id).eq("user_id", senderId).maybeSingle();
    if (!senderMember) return json({ error: "Forbidden" }, 403);

    const { data: members } = await admin.from("chat_thread_members")
      .select("user_id").eq("thread_id", thread_id).neq("user_id", senderId);
    const recipients = (members || []).map((m: any) => m.user_id);
    if (!recipients.length) return json({ sent: 0 });

    const { data: sender } = await admin.from("profiles")
      .select("display_name").eq("user_id", senderId).maybeSingle();
    const senderName = (sender as any)?.display_name || "—";

    const { data: recips } = await admin.from("profiles")
      .select("user_id, default_locale").in("user_id", recipients);

    // Group by locale to minimise send-push calls
    const byLocale = new Map<string, string[]>();
    for (const r of recips || []) {
      const loc = normalizeLocale((r as any).default_locale);
      const arr = byLocale.get(loc) || [];
      arr.push((r as any).user_id);
      byLocale.set(loc, arr);
    }

    let sent = 0;
    for (const [loc, ids] of byLocale) {
      const body = preview?.trim() ? preview.trim().slice(0, 120) : t("chatNewMessage", loc as any);
      const { data: pushResp } = await admin.functions.invoke("send-push", {
        body: {
          user_ids: ids,
          title: senderName,
          body,
          url: "/dashboard",
          data: { type: "chat", thread_id },
        },
      });
      sent += Number((pushResp as any)?.sent || 0);
    }
    return json({ sent });
  } catch (e) {
    console.error("notify-chat-message error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
