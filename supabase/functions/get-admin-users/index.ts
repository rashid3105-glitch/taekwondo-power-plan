import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is admin
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await userClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the server-only admin client for both auth emails and approval data.
    // Returning profiles here avoids platform-specific RLS/session races in an
    // installed app while the caller is still explicitly verified above.
    const [{ data: authUsers, error: authUsersError }, { data: profiles, error: profilesError }] = await Promise.all([
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      adminClient
        .from("profiles")
        .select("user_id, display_name, created_at, is_approved, age, weight_kg, belt_level, experience_years, goals, sessions_per_week, payment_status, payment_date, is_demo, demo_full_access, demo_expires_at, club_id, discipline, country, current_injury, last_seen_at, birth_date, sport_start_date, phone, phone_country_code, athlete_code")
        .or("is_parent.is.null,is_parent.eq.false")
        .order("created_at", { ascending: false }),
    ]);

    if (authUsersError || profilesError) {
      throw authUsersError ?? profilesError;
    }

    const emailMap: Record<string, string> = {};
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        emailMap[u.id] = u.email || "";
      }
    }

    return new Response(JSON.stringify({ emailMap, profiles: profiles ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
