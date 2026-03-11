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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Find demo users who are unpaid and created more than 14 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: expiredDemos, error: fetchError } = await adminClient
      .from("profiles")
      .select("user_id, display_name")
      .eq("is_demo", true)
      .neq("payment_status", "paid")
      .lt("created_at", fourteenDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    const deleted: string[] = [];
    for (const profile of expiredDemos || []) {
      // Delete all associated data
      await Promise.all([
        adminClient.from("training_plans").delete().eq("user_id", profile.user_id),
        adminClient.from("rehab_plans").delete().eq("user_id", profile.user_id),
        adminClient.from("mental_assessments").delete().eq("user_id", profile.user_id),
        adminClient.from("workout_logs").delete().eq("user_id", profile.user_id),
        adminClient.from("user_exercises").delete().eq("user_id", profile.user_id),
        adminClient.from("coach_athletes").delete().eq("athlete_id", profile.user_id),
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
