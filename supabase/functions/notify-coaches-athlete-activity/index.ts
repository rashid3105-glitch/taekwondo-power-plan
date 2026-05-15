// Notifies all coaches in the athlete's club when the athlete saves a diary
// entry or completes a competition reflection. Enforces a 24h cooldown per
// athlete per activity type by checking email_send_log metadata.
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const { data: userData, error: userErr } = await userClient.auth.getUser();
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

    // Find approved coaches in the same club
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");
    const coachIds = (roleRows || []).map((r: any) => r.user_id);
    if (coachIds.length === 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_coaches" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: coachProfiles } = await admin
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", coachIds)
      .eq("club_id", clubId)
      .eq("is_approved", true);

    if (!coachProfiles || coachProfiles.length === 0) {
      return new Response(JSON.stringify({ queued: 0, reason: "no_club_coaches" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dayBucket = new Date().toISOString().slice(0, 10);
    let queued = 0;
    for (const coach of coachProfiles) {
      const { data: au } = await admin.auth.admin.getUserById(coach.user_id);
      const coachEmail = au?.user?.email;
      if (!coachEmail) continue;

      const idemKey = `athlete-activity-${athleteUserId}-${activityType}-${coach.user_id}-${dayBucket}`;

      // Pre-insert log row carrying metadata (so cooldown lookup matches even
      // before the queue dispatcher runs). The send function will append its
      // own 'pending'/'sent' rows; this 'queued' row is only used by us.
      await admin.from("email_send_log").insert({
        template_name: "athlete-activity-notification",
        recipient_email: coachEmail,
        status: "pending",
        metadata: {
          athlete_user_id: athleteUserId,
          activity_type: activityType,
          coach_user_id: coach.user_id,
          source: "notify-coaches-athlete-activity",
        },
      });

      const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          apikey: anonKey,
        },
        body: JSON.stringify({
          templateName: "athlete-activity-notification",
          recipientEmail: coachEmail,
          idempotencyKey: idemKey,
          templateData: {
            athleteName,
            activityType,
            competitionName,
          },
        }),
      });
      if (resp.ok) queued++;
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
