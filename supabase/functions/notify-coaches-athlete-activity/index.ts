// Notifies coaches in the athlete's club when a diary entry or competition
// reflection is saved. Uses enqueue_email RPC directly with service role.
import { createClient } from "npm:@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { TEMPLATES } from "../_shared/transactional-email-templates/registry.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_NAME = "taekwondo-power-plan";
const SENDER_DOMAIN = "notify.sportstalent.dk";
const FROM_DOMAIN = "sportstalent.dk";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const athleteUserId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const activityType: string = body.activity_type;
    const competitionName: string | undefined = body.competition_name || undefined;
    if (activityType !== "diary" && activityType !== "competition_reflection") {
      return new Response(JSON.stringify({ error: "Invalid activity_type" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, club_id")
      .eq("user_id", athleteUserId)
      .maybeSingle();
    if (!profile?.club_id) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_club" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const athleteName = profile.display_name || "En atlet";
    const clubId = profile.club_id;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("email_send_log")
      .select("id")
      .eq("template_name", "athlete-activity-notification")
      .gte("created_at", since)
      .contains("metadata", { athlete_user_id: athleteUserId, activity_type: activityType })
      .limit(1);
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "cooldown" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Find coaches: query coach_athletes for coaches who have athletes in this club
    const { data: clubAthletes } = await admin
      .from("profiles")
      .select("user_id")
      .eq("club_id", clubId);

    const clubAthleteIds = (clubAthletes || []).map((r: any) => r.user_id);

    if (clubAthleteIds.length === 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_athletes_in_club" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: coachRows } = await admin
      .from("coach_athletes")
      .select("coach_id")
      .in("athlete_id", clubAthleteIds);

    const coachIdSet = new Set(
      (coachRows || []).map((r: any) => r.coach_id).filter(Boolean),
    );
    const coachUserIds = Array.from(coachIdSet) as string[];

    if (coachUserIds.length === 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_coaches_found" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: coachProfiles } = await admin
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", coachUserIds)
      .eq("is_approved", true)
      .neq("user_id", athleteUserId);
    if (!coachProfiles || coachProfiles.length === 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_approved_coaches" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const templateEntry = TEMPLATES["athlete-activity-notification"];
    if (!templateEntry) {
      return new Response(JSON.stringify({ queued: 0, reason: "template_not_found" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const templateData = { athleteName, activityType, competitionName };
    const html = await renderAsync(React.createElement(templateEntry.component, templateData));
    const plainText = await renderAsync(
      React.createElement(templateEntry.component, templateData),
      { plainText: true },
    );
    const subject = typeof templateEntry.subject === "function"
      ? templateEntry.subject(templateData)
      : templateEntry.subject;

    let queued = 0;
    for (const coach of coachProfiles) {
      const { data: au } = await admin.auth.admin.getUserById(coach.user_id);
      const coachEmail = au?.user?.email;
      if (!coachEmail) continue;

      const normalizedEmail = coachEmail.toLowerCase();

      const { data: suppressed } = await admin
        .from("suppressed_emails")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (suppressed) continue;

      let unsubToken: string;
      const { data: existingToken } = await admin
        .from("email_unsubscribe_tokens")
        .select("token, used_at")
        .eq("email", normalizedEmail)
        .maybeSingle();
      if (existingToken && !existingToken.used_at) {
        unsubToken = existingToken.token;
      } else {
        unsubToken = generateToken();
        await admin.from("email_unsubscribe_tokens").upsert(
          { token: unsubToken, email: normalizedEmail },
          { onConflict: "email", ignoreDuplicates: true },
        );
        const { data: stored } = await admin
          .from("email_unsubscribe_tokens")
          .select("token")
          .eq("email", normalizedEmail)
          .maybeSingle();
        if (stored) unsubToken = stored.token;
      }

      const messageId = crypto.randomUUID();
      const idemKey = `athlete-activity-${athleteUserId}-${activityType}-${coach.user_id}-${new Date().toISOString().slice(0, 10)}`;

      await admin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "athlete-activity-notification",
        recipient_email: coachEmail,
        status: "pending",
        metadata: {
          athlete_user_id: athleteUserId,
          activity_type: activityType,
          coach_user_id: coach.user_id,
        },
      }).then(() => {}, () => {});

      const { error: enqueueErr } = await admin.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          to: coachEmail,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text: plainText,
          purpose: "transactional",
          label: "athlete-activity-notification",
          idempotency_key: idemKey,
          unsubscribe_token: unsubToken,
          queued_at: new Date().toISOString(),
        },
      });

      if (!enqueueErr) {
        queued++;
      } else {
        console.error("enqueue_email error", { coachEmail, enqueueErr });
      }
    }

    return new Response(JSON.stringify({ queued }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
