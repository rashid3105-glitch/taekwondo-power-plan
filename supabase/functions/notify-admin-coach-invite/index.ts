import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const inviteCode: string | undefined = body?.invite_code;
    if (!inviteCode) {
      return new Response(JSON.stringify({ error: "invite_code required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Look up invite and verify caller is the coach who created it
    const { data: invite, error: invErr } = await admin
      .from("coach_invites")
      .select("code, coach_id, club_id, created_at")
      .eq("code", inviteCode)
      .maybeSingle();
    if (invErr || !invite) {
      return new Response(JSON.stringify({ error: "invite_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invite.coach_id !== callerId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lookup coach + club details
    const [{ data: coachProfile }, { data: club }, { data: authUser }] = await Promise.all([
      admin.from("profiles").select("display_name").eq("user_id", invite.coach_id).maybeSingle(),
      invite.club_id
        ? admin.from("clubs").select("name").eq("id", invite.club_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.auth.admin.getUserById(invite.coach_id),
    ]);

    const payload = {
      templateName: "coach-invite-admin-notification",
      idempotencyKey: `coach-invite-${invite.code}`,
      templateData: {
        coachName: coachProfile?.display_name || authUser?.user?.email || "Unknown",
        coachEmail: authUser?.user?.email || null,
        clubName: (club as any)?.name || null,
        inviteCode: invite.code,
        inviteUrl: `https://sportstalent.dk/join/${invite.code}`,
        createdAt: invite.created_at,
      },
    };

    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("send-transactional-email failed", res.status, errText);
      return new Response(JSON.stringify({ error: "send_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-admin-coach-invite error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
