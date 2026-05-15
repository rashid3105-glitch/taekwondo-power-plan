// Notifies all coaches in the athlete's club when the athlete saves a diary
// entry or completes a competition reflection. Enforces a 24h cooldown per
// athlete per activity type by checking email_send_log metadata.
import { createClient } from "npm:@supabase/supabase-js@2";
import { TEMPLATES } from "../_shared/transactional-email-templates/registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const athleteUserId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const activityType: string = body.activity_type;
    const competitionName: string | undefined = body.competition_name || undefined;
    if (activityType !== "diary" && activityType !== "competition_reflection") {
      return new Response(JSON.stringify({ error: "Invalid activity_type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const athleteName = profile.display_name || "En atlet";
    const clubId = profile.club_id;

    // 24h cooldown: any prior notification email logged for this athlete+type
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find coaches: profiles in this club who are referenced as coach_id
    // by other profiles in the same club.
    const { data: athleteProfiles } = await admin
      .from("profiles")
      .select("coach_id")
      .eq("club_id", clubId)
      .not("coach_id", "is", null);

    const coachIdSet = new Set(
      (athleteProfiles || []).map((r: any) => r.coach_id).filter(Boolean),
    );
    const coachUserIds = Array.from(coachIdSet) as string[];

    if (coachUserIds.length === 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_coaches_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ queued: 0, reason: "missing_resend_key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateEntry = TEMPLATES["athlete-activity-notification"];
    const templateData = { athleteName, activityType, competitionName };
    const html = await renderAsync(
      React.createElement(templateEntry.component, templateData),
    );
    const subject = typeof templateEntry.subject === "function"
      ? templateEntry.subject(templateData)
      : templateEntry.subject;

    let queued = 0;
    for (const coach of coachProfiles) {
      const { data: au } = await admin.auth.admin.getUserById(coach.user_id);
      const coachEmail = au?.user?.email;
      if (!coachEmail) continue;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Sportstalent.dk <noreply@sportstalent.dk>",
          to: [coachEmail],
          subject,
          html,
        }),
      });

      if (resendRes.ok) {
        queued++;
        await admin.from("email_send_log").insert({
          template_name: "athlete-activity-notification",
          recipient_email: coachEmail,
          status: "sent",
          metadata: {
            athlete_user_id: athleteUserId,
            activity_type: activityType,
            coach_user_id: coach.user_id,
          },
        }).then(() => {}, () => {});
      } else {
        const err = await resendRes.text();
        console.error("Resend error", { coachEmail, err });
      }
    }

    return new Response(JSON.stringify({ queued }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
