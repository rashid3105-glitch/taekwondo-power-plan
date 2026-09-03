// Scheduled job: remind guardians who have not confirmed a consent link yet.
// Token life is CONSENT_TOKEN_DAYS (30). Reminders go out on day 3, 10 and 21
// after the token was created, plus a final expiry warning on day 27.
// Idempotency keys make repeated runs safe.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  CONSENT_TOKEN_DAYS,
  CONSENT_REMINDER_DAYS,
  CONSENT_EXPIRY_WARNING_DAY,
} from "../_shared/age.ts";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const APP_URL = "https://sportstalent.dk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCHEDULE = [...CONSENT_REMINDER_DAYS, CONSENT_EXPIRY_WARNING_DAY];

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 3600 * 1000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Only the platform itself (service role) or a platform admin may trigger this.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (token !== serviceKey) {
    const { data: { user } } = await admin.auth.getUser(token);
    const { data: isAdmin } = user
      ? await admin.rpc("is_admin", { _user_id: user.id })
      : { data: false };
    if (!isAdmin) {
      return json({ error: "forbidden" }, 403);
    }
  }

  try {
    const cutoff = new Date(Date.now() - CONSENT_TOKEN_DAYS * 24 * 3600 * 1000).toISOString();

    const { data: tokens, error } = await admin
      .from("consent_tokens")
      .select("id, token, athlete_id, parent_email, created_at, expires_at, confirmed_at")
      .is("confirmed_at", null)
      .gt("expires_at", new Date().toISOString())
      .gte("created_at", cutoff);
    if (error) throw error;

    let sent = 0;
    let skipped = 0;

    for (const tk of tokens || []) {
      const age = daysSince(tk.created_at);
      const step = SCHEDULE.find((d) => d === age);
      if (!step) { skipped++; continue; }
      if (!tk.parent_email) { skipped++; continue; }

      // Guardian said "not my child" → never remind again.
      const { data: optOut } = await admin
        .from("consent_token_events")
        .select("id")
        .eq("token_id", tk.id)
        .eq("event", "not_my_child")
        .limit(1);
      if (optOut && optOut.length > 0) { skipped++; continue; }

      const { data: prof } = await admin
        .from("profiles")
        .select("display_name, club_id, clubs:club_id(name)")
        .eq("user_id", tk.athlete_id)
        .maybeSingle();

      const reminderNumber = SCHEDULE.indexOf(step) + 1;
      const daysLeft = Math.max(
        0,
        Math.ceil((new Date(tk.expires_at).getTime() - Date.now()) / (24 * 3600 * 1000)),
      );

      const result = await sendTemplateEmail("parental-consent-request", tk.parent_email, {
        idempotencyKey: `parental-consent-reminder-${tk.id}-${step}`,
        templateData: {
          athleteName: (prof as any)?.display_name || "your child",
          clubName: (prof as any)?.clubs?.name || null,
          consentUrl: `${APP_URL}/consent/${tk.token}`,
          expiresInDays: CONSENT_TOKEN_DAYS,
          daysLeft,
          reminderNumber,
        },
      });

      if (result.sent) {
        sent++;
        await admin.from("consent_token_events").insert({
          token_id: tk.id,
          athlete_id: tk.athlete_id,
          club_id: (prof as any)?.club_id ?? null,
          event: "reminder_sent",
          meta: { day: step, reminder_number: reminderNumber },
        });
      } else {
        skipped++;
        console.warn("reminder not sent", result.reason);
      }
    }

    return json({ ok: true, considered: (tokens || []).length, sent, skipped });
  } catch (e) {
    console.error("send-consent-reminders error", e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
