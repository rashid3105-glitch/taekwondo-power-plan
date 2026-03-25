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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify calling user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { confirmation } = await req.json();
    if (confirmation !== "DELETE MY ACCOUNT") {
      throw new Error("Invalid confirmation text");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userId = user.id;

    // Delete all user data
    await Promise.all([
      adminClient.from("diary_entries").delete().eq("user_id", userId),
      adminClient.from("physical_test_results").delete().eq("user_id", userId),
      adminClient.from("mental_assessments").delete().eq("user_id", userId),
      adminClient.from("user_recipes").delete().eq("user_id", userId),
      adminClient.from("user_exercises").delete().eq("user_id", userId),
      adminClient.from("workout_logs").delete().eq("user_id", userId),
      adminClient.from("rehab_plans").delete().eq("user_id", userId),
      adminClient.from("training_plans").delete().eq("user_id", userId),
      adminClient.from("coach_athletes").delete().eq("athlete_id", userId),
      adminClient.from("coach_athletes").delete().eq("coach_id", userId),
      adminClient.from("user_roles").delete().eq("user_id", userId),
    ]);

    // Delete profile
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
