// Runs every 15 minutes via pg_cron. Fires reminders for:
// - Today's training session (1h before 18:00 default)
// - Competition countdown milestones (-30/-14/-7/-3/-1 days at 09:00 local)
// - Daily weight-log nudge during active cut window (08:00 local)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkCronAuth } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const unauthorized = checkCronAuth(req, corsHeaders);
  if (unauthorized) return unauthorized;

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const hour = now.getUTCHours();

  const sendPush = async (user_ids: string[], title: string, body: string, url: string, category: string, tag: string) => {
    if (!user_ids.length) return;
    await supa.functions.invoke("send-push", { body: { user_ids, title, body, url, category, tag } });
  };

  let triggered = 0;

  // 1. Competition countdown + post-event reflection nudge — fire at 07:00–08:00 UTC (~09:00 CET)
  if (hour === 7) {
    // Look back up to 14 days for reflection nudges
    const lookback = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
    const { data: comps } = await supa
      .from("competitions")
      .select("id, user_id, name, event_date")
      .gte("event_date", lookback);

    // Pre-fetch reflections for these competitions to avoid N+1
    const compIds = (comps || []).map((c: any) => c.id);
    const reflectedSet = new Set<string>();
    if (compIds.length) {
      const { data: refls } = await supa
        .from("competition_reflections")
        .select("competition_id")
        .in("competition_id", compIds);
      for (const r of refls || []) if (r.competition_id) reflectedSet.add(r.competition_id);
    }

    for (const c of comps || []) {
      const eventDate = new Date(c.event_date);
      const diffDays = Math.round((eventDate.getTime() - now.getTime()) / 86400000);

      // Pre-event countdown
      if ([30, 14, 7, 3, 1].includes(diffDays)) {
        await sendPush([c.user_id], `🥋 ${diffDays} day${diffDays === 1 ? "" : "s"} to ${c.name}`,
          "Open the app to see today's plan and weight target.", "/competitions", "competition", `comp-${c.user_id}-${diffDays}`);
        triggered++;
      }

      // Post-event reflection nudge — day +1, +3, +7 after event if not yet reflected
      if ([-1, -3, -7].includes(diffDays) && !reflectedSet.has(c.id)) {
        const dayLabel = Math.abs(diffDays);
        await sendPush(
          [c.user_id],
          `📝 Reflect on ${c.name}`,
          dayLabel === 1
            ? "How did it go? Take 3 minutes to lock in lessons while it's fresh."
            : `It's been ${dayLabel} days — capture your reflection before it fades.`,
          `/competitions/${c.id}/reflect`,
          "competition",
          `reflect-${c.user_id}-${c.id}-${dayLabel}`,
        );
        triggered++;
      }
    }
  }

  // 2. Daily weight-log nudge at 06:00–07:00 UTC (~08:00 CET) — only if user has competition in next 30 days
  if (hour === 6) {
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const { data: cutting } = await supa.from("competitions").select("user_id").gte("event_date", todayStr).lte("event_date", in30);
    const uniqueUsers = [...new Set((cutting || []).map((c: any) => c.user_id))];
    // Skip users who already logged today
    if (uniqueUsers.length) {
      const { data: logged } = await supa.from("weight_logs").select("user_id").eq("log_date", todayStr).in("user_id", uniqueUsers);
      const loggedSet = new Set((logged || []).map((l: any) => l.user_id));
      const need = uniqueUsers.filter((u) => !loggedSet.has(u));
      if (need.length) {
        await sendPush(need, "⚖️ Log today's weight", "Stay on track for your competition.", "/competitions", "weight", `weight-${todayStr}`);
        triggered += need.length;
      }
    }
  }

  // 3. Daily readiness check-in nudge at 05:00–06:00 UTC (~07:00 CET)
  if (hour === 5) {
    const { data: actives } = await supa.from("profiles").select("user_id").eq("is_approved", true);
    const userIds = (actives || []).map((p: any) => p.user_id);
    if (userIds.length) {
      const { data: done } = await supa.from("readiness_checkins").select("user_id").eq("checkin_date", todayStr).in("user_id", userIds);
      const doneSet = new Set((done || []).map((r: any) => r.user_id));
      const need = userIds.filter((u: string) => !doneSet.has(u));
      if (need.length) {
        await sendPush(need.slice(0, 200), "☀️ Morning readiness check", "10-second check-in to adapt today's training.", "/dashboard", "training", `readiness-${todayStr}`);
        triggered += need.length;
      }
    }
  }

  return new Response(JSON.stringify({ triggered }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
