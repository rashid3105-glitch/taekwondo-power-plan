// Send a web-push notification to all subscriptions of one or many users
// Auth model:
//   - Service-role JWT: full trust (used by dispatch-scheduled-pushes / cron)
//   - User JWT: caller must be a coach AND every recipient must either be the
//     caller themselves or an athlete explicitly linked via coach_athletes.
// `url` is restricted to internal app paths to prevent phishing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(500),
  title: z.string().min(1).max(120),
  body: z.string().max(400).default(""),
  // Restricted to internal relative paths (must start with `/`, no protocol, no `//`)
  url: z
    .string()
    .max(300)
    .default("/dashboard")
    .refine(
      (u) => /^\/[A-Za-z0-9\-_/?=&%.#]*$/.test(u) && !u.startsWith("//"),
      { message: "url must be an internal app path starting with /" },
    ),
  category: z.enum(["training", "diary", "events", "competition", "weight"]).optional(),
  tag: z.string().max(60).optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ----- Auth: require a valid JWT (service-role OR user) -----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice("Bearer ".length).trim();

    const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supaUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const callerRole = claimsData.claims.role as string | undefined;
    const callerId = claimsData.claims.sub as string | undefined;
    const isServiceRole = callerRole === "service_role";

    // ----- Validate body -----
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten() }, 400);
    }
    const { user_ids, title, body, url, category, tag } = parsed.data;

    const supa = createClient(SUPABASE_URL, SERVICE_KEY);

    // ----- Authorization: non-service-role callers must own the recipients -----
    if (!isServiceRole) {
      if (!callerId) return jsonResponse({ error: "Unauthorized" }, 401);

      const otherIds = user_ids.filter((id) => id !== callerId);
      if (otherIds.length > 0) {
        // Caller must be a coach
        const { data: hasCoach } = await supa.rpc("has_role", {
          _user_id: callerId,
          _role: "coach",
        });
        const { data: isAdmin } = await supa.rpc("is_admin", { _user_id: callerId });
        if (!hasCoach && !isAdmin) {
          return jsonResponse({ error: "Forbidden" }, 403);
        }
        if (!isAdmin) {
          // Every other recipient must be an explicitly linked athlete
          const { data: links } = await supa
            .from("coach_athletes")
            .select("athlete_id")
            .eq("coach_id", callerId)
            .in("athlete_id", otherIds);
          const linkedSet = new Set((links || []).map((l: any) => l.athlete_id));
          const unauthorized = otherIds.filter((id) => !linkedSet.has(id));
          if (unauthorized.length > 0) {
            return jsonResponse({ error: "Forbidden — recipient not linked" }, 403);
          }
        }
      }
    }

    // ----- VAPID -----
    const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:rashid3105@gmail.com";
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

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
    if (targets.length === 0) return jsonResponse({ sent: 0 });

    const { data: subs } = await supa.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", targets);
    if (!subs?.length) return jsonResponse({ sent: 0 });

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

    return jsonResponse({ sent, removed: dead.length });
  } catch (e: any) {
    return jsonResponse({ error: e.message }, 500);
  }
});
