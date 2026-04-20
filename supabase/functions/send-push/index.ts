// Send a web-push notification to all subscriptions of one or many users
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(500),
  title: z.string().min(1).max(120),
  body: z.string().max(400).default(""),
  url: z.string().max(300).default("/dashboard"),
  category: z.enum(["training", "diary", "events", "competition", "weight"]).optional(),
  tag: z.string().max(60).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:rashid3105@gmail.com";
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { user_ids, title, body, url, category, tag } = parsed.data;

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Filter user_ids by category preference
    let targets = user_ids;
    if (category) {
      const prefCol = {
        training: "training_reminders",
        diary: "diary_comments",
        events: "event_reminders",
        competition: "competition_countdown",
        weight: "weight_log_reminders",
      }[category];
      const { data: prefs } = await supa.from("notification_preferences").select(`user_id, ${prefCol}`).in("user_id", user_ids);
      const optedIn = new Set((prefs || []).filter((p: any) => p[prefCol] !== false).map((p: any) => p.user_id));
      // Default: opted in if no row exists
      targets = user_ids.filter((id) => !prefs?.find((p: any) => p.user_id === id) || optedIn.has(id));
    }
    if (targets.length === 0) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: subs } = await supa.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", targets);
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const payload = JSON.stringify({ title, body, url, tag: tag || category || "sportstalent" });
    let sent = 0; const dead: string[] = [];
    await Promise.all(subs.map(async (s: any) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(s.id);
      }
    }));
    if (dead.length) await supa.from("push_subscriptions").delete().in("id", dead);

    return new Response(JSON.stringify({ sent, removed: dead.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
