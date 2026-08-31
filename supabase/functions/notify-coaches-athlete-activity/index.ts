// Notifies coaches in the athlete's club when a diary entry or competition
// reflection is saved. Sends through Lovable's managed email API.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTemplateEmail } from "../_shared/transactional-email-templates/send-email.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


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

    const templateData = { athleteName, activityType, competitionName };

    let queued = 0;
    for (const coach of coachProfiles) {
      const { data: au } = await admin.auth.admin.getUserById(coach.user_id);
      const coachEmail = au?.user?.email;
      if (!coachEmail) continue;

      const idemKey = `athlete-activity-${athleteUserId}-${activityType}-${coach.user_id}-${new Date().toISOString().slice(0, 10)}`;
      const metadata = {
        athlete_user_id: athleteUserId,
        activity_type: activityType,
        coach_user_id: coach.user_id,
      };

      const logSend = async (status: string, errorMessage?: string) => {
        const { error } = await admin.from("email_send_log").insert({
          template_name: "athlete-activity-notification",
          recipient_email: coachEmail,
          status,
          error_message: errorMessage ?? null,
          metadata,
        });
        if (error) console.error("email_send_log insert failed", error);
      };

      try {
        const result = await sendTemplateEmail("athlete-activity-notification", coachEmail, {
          idempotencyKey: idemKey,
          templateData,
        });
        if (result.sent) {
          await logSend("sent");
          queued++;
        } else {
          await logSend("suppressed");
        }
      } catch (sendErr: any) {
        console.error("athlete-activity notification send failed", sendErr?.message || sendErr);
        await logSend("failed", String(sendErr?.message || sendErr));
      }
    }

    // Also send push notification to coaches — grouped by recipient locale.
    const coachUserIdsForPush = coachProfiles.map((c: any) => c.user_id);
    if (coachUserIdsForPush.length > 0) {
      const { normalizeLocale, t } = await import("../_shared/pushI18n.ts");
      const { data: coachLocales } = await admin.from("profiles")
        .select("user_id, default_locale").in("user_id", coachUserIdsForPush);
      const byLocale = new Map<string, string[]>();
      for (const c of coachLocales || []) {
        const loc = normalizeLocale((c as any).default_locale);
        const arr = byLocale.get(loc) || [];
        arr.push((c as any).user_id);
        byLocale.set(loc, arr);
      }
      for (const [loc, ids] of byLocale) {
        const isDiary = activityType === "diary";
        const title = isDiary
          ? t("diaryNewEntryTitle", loc as any)
          : t("competitionReflectionTitle", loc as any);
        const body = isDiary
          ? t("diaryNewEntry", loc as any, athleteName)
          : t("competitionReflectionBody", loc as any, competitionName ? `${athleteName} — ${competitionName}` : athleteName);
        await admin.functions.invoke("send-push", {
          body: {
            user_ids: ids,
            title,
            body,
            url: "/coach",
            data: { type: activityType, athlete_id: athleteUserId },
          },
        }).catch(() => {});
      }
    }

    // Note: previously this function also inserted a chat_message per coach
    // for diary updates, but that surfaced the message in the athlete's own
    // inbox (as sender) with a coach-only link. Push notifications above
    // already inform coaches, so no in-app chat insert is needed.




    return new Response(JSON.stringify({ queued }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
