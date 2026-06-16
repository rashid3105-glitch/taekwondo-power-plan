import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const clubId = typeof body.club_id === "string" ? body.club_id : "";
    const confirmCrossClub = body.confirm_cross_club === true;
    if (!code) return json({ error: "code required" }, 400);
    if (!clubId) return json({ error: "club_id required" }, 400);

    console.log("add-athlete-by-code start", { code, clubId, callerId: user.id });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Caller must be admin OR active coach/admin in the target club
    const [{ data: isAdmin }, { data: membership }] = await Promise.all([
      admin.rpc("is_admin", { _user_id: user.id }),
      admin.from("club_memberships" as any)
        .select("role_in_club, status")
        .eq("user_id", user.id)
        .eq("club_id", clubId)
        .maybeSingle(),
    ]);
    const m = membership as any;
    const isClubCoach = m?.status === "active" && (m?.role_in_club === "coach" || m?.role_in_club === "admin");
    if (!isAdmin && !isClubCoach) {
      console.log("forbidden", { isAdmin, membership });
      return json({ error: "forbidden" }, 403);
    }

    // Look up athlete by code
    const { data: athleteId, error: lookupErr } = await admin.rpc("lookup_athlete_by_code", { _code: code });
    if (lookupErr) {
      console.log("lookup error", lookupErr);
      return json({ error: lookupErr.message }, 400);
    }
    if (!athleteId) return json({ error: "ATHLETE_NOT_FOUND" }, 404);
    console.log("athlete resolved", { athleteId });

    // Resolve club name + capacity
    const { data: clubRow } = await admin
      .from("clubs").select("name, max_athletes").eq("id", clubId).maybeSingle();
    const clubName = (clubRow as any)?.name ?? null;

    // Cross-club guard: if coach already has this athlete linked in OTHER clubs,
    // require an explicit confirm.
    if (!confirmCrossClub) {
      const { data: otherLinks } = await admin
        .from("coach_athletes")
        .select("club_id, clubs:club_id ( name )")
        .eq("coach_id", user.id)
        .eq("athlete_id", athleteId);
      const others = ((otherLinks as any[]) ?? [])
        .filter((r) => r.club_id && r.club_id !== clubId);
      if (others.length > 0) {
        const otherClubNames = others
          .map((r) => r.clubs?.name)
          .filter((n) => typeof n === "string" && n.length > 0);
        console.log("cross-club confirm required", { otherClubNames });
        return json({
          error: "CROSS_CLUB_CONFIRM",
          target_club_name: clubName,
          other_club_names: otherClubNames,
        }, 409);
      }
    }

    // License limit (per club)
    if (!isAdmin) {
      const { data: count } = await admin.rpc("club_athlete_count", { _club_id: clubId });
      const limit = (clubRow as any)?.max_athletes ?? 5;
      const currentCount = typeof count === "number" ? count : 0;

      const { data: existingMembership } = await admin
        .from("club_memberships" as any)
        .select("id, status, role_in_club")
        .eq("user_id", athleteId)
        .eq("club_id", clubId)
        .eq("role_in_club", "athlete")
        .maybeSingle();
      const alreadyCounted = (existingMembership as any)?.status === "active";

      if (!alreadyCounted && currentCount >= limit) {
        console.log("max athletes reached", { currentCount, limit });
        return json({ error: "MAX_ATHLETES_REACHED", club_name: clubName }, 400);
      }
    }

    // Ensure athlete membership exists & is active in this club
    const { error: membershipErr } = await admin
      .from("club_memberships" as any)
      .upsert(
        {
          user_id: athleteId,
          club_id: clubId,
          role_in_club: "athlete",
          status: "active",
        },
        { onConflict: "user_id,club_id,role_in_club" },
      );
    if (membershipErr) {
      console.log("membership upsert failed", membershipErr);
      return json({
        error: "MEMBERSHIP_UPSERT_FAILED",
        detail: membershipErr.message,
        club_name: clubName,
      }, 500);
    }

    // Insert coach<->athlete link for this club (idempotent on unique constraint)
    const { error: linkErr } = await admin
      .from("coach_athletes")
      .insert({ coach_id: user.id, athlete_id: athleteId, club_id: clubId });
    if (linkErr && linkErr.code !== "23505") {
      console.log("coach_athletes insert failed", linkErr);
      return json({
        error: "COACH_LINK_FAILED",
        detail: linkErr.message,
        club_name: clubName,
      }, 500);
    }

    // Cleanup legacy NULL-club row for this (coach, athlete), if any survived
    await admin
      .from("coach_athletes")
      .delete()
      .eq("coach_id", user.id)
      .eq("athlete_id", athleteId)
      .is("club_id", null);

    // Verify both rows now exist
    const [verifyMembership, verifyLink] = await Promise.all([
      admin.from("club_memberships" as any)
        .select("id")
        .eq("user_id", athleteId)
        .eq("club_id", clubId)
        .eq("role_in_club", "athlete")
        .eq("status", "active")
        .maybeSingle(),
      admin.from("coach_athletes")
        .select("id")
        .eq("coach_id", user.id)
        .eq("athlete_id", athleteId)
        .eq("club_id", clubId)
        .maybeSingle(),
    ]);

    if (!verifyMembership.data || !verifyLink.data) {
      console.log("verify failed", {
        membership: verifyMembership,
        link: verifyLink,
      });
      return json({
        error: "VERIFY_FAILED",
        detail: "Could not confirm athlete was added — please try again.",
        club_name: clubName,
      }, 500);
    }

    console.log("add-athlete-by-code success", {
      athleteId,
      clubId,
      already: linkErr?.code === "23505",
    });

    return json({
      ok: true,
      already: linkErr?.code === "23505",
      athlete_id: athleteId,
      club_id: clubId,
      club_name: clubName,
    });
  } catch (err: any) {
    console.error("add-athlete-by-code unexpected", err);
    return new Response(JSON.stringify({ error: err?.message ?? "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
