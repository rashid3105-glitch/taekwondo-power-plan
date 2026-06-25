import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  // For free-form bulk message
  athleteIds?: string[];
  subject?: string;
  body?: string;
  // For event reminder fan-out (also emails)
  reminderIds?: string[];
}

const APP_DASHBOARD_URL = "https://taekwondo-power-plan.lovable.app/dashboard";
const APP_DIARY_URL = "https://taekwondo-power-plan.lovable.app/diary";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No auth" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is a coach
    const { data: isCoach } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "coach",
    });
    if (!isCoach) return json({ error: "Forbidden — coach role required" }, 403);

    const payload = (await req.json()) as Payload;

    // Coach display name for email
    const { data: coachProfile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const coachName = coachProfile?.display_name || "Your coach";

    let inserted = 0;
    let emailed = 0;
    let failed = 0;

    // ───────── PATH A: free-form bulk message ─────────
    if (payload.athleteIds && payload.subject) {
      const subject = payload.subject.trim().slice(0, 200);
      const body = (payload.body || "").trim().slice(0, 5000);
      if (!subject) return json({ error: "Subject required" }, 400);
      if (payload.athleteIds.length === 0) return json({ error: "No athletes selected" }, 400);
      if (payload.athleteIds.length > 200) return json({ error: "Too many recipients (max 200)" }, 400);

      // Verify the coach is actually allowed to message each athlete
      const { data: managed } = await admin
        .from("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", user.id)
        .in("athlete_id", payload.athleteIds);
      const managedIds = new Set((managed || []).map((r) => r.athlete_id));

      // Club-mates fallback
      const { data: coachProf } = await admin
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const clubId = coachProf?.club_id || null;

      let clubmateIds = new Set<string>();
      if (clubId) {
        const { data: mates } = await admin
          .from("profiles")
          .select("user_id")
          .eq("club_id", clubId)
          .in("user_id", payload.athleteIds);
        clubmateIds = new Set((mates || []).map((r) => r.user_id));
      }

      const allowedIds = payload.athleteIds.filter(
        (id) => managedIds.has(id) || clubmateIds.has(id),
      );

      if (allowedIds.length === 0) {
        return json({ error: "No permitted recipients" }, 403);
      }

      // Athlete profile names
      const { data: athleteProfiles } = await admin
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", allowedIds);
      const nameMap = new Map(
        (athleteProfiles || []).map((p) => [p.user_id, p.display_name || "Athlete"]),
      );

      // Athlete emails (service role only)
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap = new Map<string, string>();
      for (const u of authUsers?.users || []) {
        if (u.id && u.email) emailMap.set(u.id, u.email);
      }

      // Insert messages
      const rows = allowedIds.map((aid) => ({
        coach_id: user.id,
        athlete_id: aid,
        subject,
        body,
      }));
      const { data: insertedRows, error: insErr } = await admin
        .from("coach_messages")
        .insert(rows)
        .select("id, athlete_id");
      if (insErr) { console.error("send-coach-message insert error", insErr); return json({ error: "server_error" }, 500); }
      inserted = insertedRows?.length || 0;

      // Dispatch emails
      for (const row of insertedRows || []) {
        const email = emailMap.get(row.athlete_id);
        if (!email) continue;
        try {
          const { error: emailErr } = await admin.functions.invoke(
            "send-transactional-email",
            {
              body: {
                templateName: "coach-message",
                recipientEmail: email,
                idempotencyKey: `coach-message-${row.id}`,
                templateData: {
                  athleteName: nameMap.get(row.athlete_id) || "Athlete",
                  coachName,
                  subject,
                  body,
                  inboxUrl: APP_DASHBOARD_URL,
                },
              },
            },
          );
          if (emailErr) failed++;
          else emailed++;
        } catch {
          failed++;
        }
      }

      return json({ inserted, emailed, failed });
    }

    // ───────── PATH B: email fan-out for existing event reminders ─────────
    if (payload.reminderIds && payload.reminderIds.length > 0) {
      if (payload.reminderIds.length > 200) {
        return json({ error: "Too many reminders (max 200)" }, 400);
      }

      const { data: reminders, error: rErr } = await admin
        .from("event_reminders")
        .select("id, athlete_id, title, message, event_date, coach_id")
        .in("id", payload.reminderIds)
        .eq("coach_id", user.id);
      if (rErr) return json({ error: rErr.message }, 500);
      if (!reminders || reminders.length === 0) return json({ inserted: 0, emailed: 0, failed: 0 });

      const athleteIds = reminders.map((r) => r.athlete_id);
      const { data: athleteProfiles } = await admin
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", athleteIds);
      const nameMap = new Map(
        (athleteProfiles || []).map((p) => [p.user_id, p.display_name || "Athlete"]),
      );

      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const emailMap = new Map<string, string>();
      for (const u of authUsers?.users || []) {
        if (u.id && u.email) emailMap.set(u.id, u.email);
      }

      for (const r of reminders) {
        const email = emailMap.get(r.athlete_id);
        if (!email) continue;
        try {
          const { error: emailErr } = await admin.functions.invoke(
            "send-transactional-email",
            {
              body: {
                templateName: "event-reminder",
                recipientEmail: email,
                idempotencyKey: `event-reminder-${r.id}`,
                templateData: {
                  athleteName: nameMap.get(r.athlete_id) || "Athlete",
                  coachName,
                  eventTitle: r.title,
                  eventDate: r.event_date,
                  message: r.message || "",
                  diaryUrl: APP_DIARY_URL,
                },
              },
            },
          );
          if (emailErr) failed++;
          else emailed++;
        } catch {
          failed++;
        }
      }

      return json({ inserted: 0, emailed, failed });
    }

    return json({ error: "No payload action provided" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
