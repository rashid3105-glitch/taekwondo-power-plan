import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // JWT authentication — require admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Verify admin role
    const { data: adminCheck } = await userClient.rpc("is_admin", { _user_id: claimsData.claims.sub });
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete demo users who are unpaid AND either:
    //  - have a manually-set demo_expires_at in the past, OR
    //  - were created more than 21 days ago and have no manual expiry set
    const today = new Date().toISOString().split("T")[0];
    const twentyOneDaysAgo = new Date();
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

    const { data: candidates, error: fetchError } = await adminClient
      .from("profiles")
      .select("user_id, display_name, created_at, demo_expires_at")
      .eq("is_demo", true)
      .neq("payment_status", "paid");

    if (fetchError) throw fetchError;

    const expiredDemos = (candidates || []).filter((p: any) => {
      if (p.demo_expires_at) return p.demo_expires_at < today;
      return new Date(p.created_at) < twentyOneDaysAgo;
    });

    const deleted: string[] = [];
    for (const profile of expiredDemos || []) {
      // Delete all associated data
      await Promise.all([
        adminClient.from("diary_entries").delete().eq("user_id", profile.user_id),
        adminClient.from("physical_test_results").delete().eq("user_id", profile.user_id),
        adminClient.from("user_recipes").delete().eq("user_id", profile.user_id),
        adminClient.from("training_plans").delete().eq("user_id", profile.user_id),
        adminClient.from("rehab_plans").delete().eq("user_id", profile.user_id),
        adminClient.from("mental_assessments").delete().eq("user_id", profile.user_id),
        adminClient.from("workout_logs").delete().eq("user_id", profile.user_id),
        adminClient.from("user_exercises").delete().eq("user_id", profile.user_id),
        adminClient.from("coach_athletes").delete().eq("athlete_id", profile.user_id),
        adminClient.from("coach_athletes").delete().eq("coach_id", profile.user_id),
        adminClient.from("user_roles").delete().eq("user_id", profile.user_id),
      ]);
      await adminClient.from("profiles").delete().eq("user_id", profile.user_id);
      // Delete auth user
      await adminClient.auth.admin.deleteUser(profile.user_id);
      deleted.push(profile.display_name || profile.user_id);
    }

    return new Response(
      JSON.stringify({ deleted, count: deleted.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
