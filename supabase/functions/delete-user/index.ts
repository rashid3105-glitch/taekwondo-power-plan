import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify calling user is admin
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await adminClient.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) throw new Error("Not an admin");

    const { user_id } = await req.json();
    if (!user_id) throw new Error("Missing user_id");
    if (user_id === user.id) throw new Error("Cannot delete yourself");

    // Delete the user (cascades to profiles, roles, etc. via FK constraints)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

    // Clean up any remaining data without FK cascades
    await Promise.all([
      adminClient.from("diary_entries").delete().eq("user_id", user_id),
      adminClient.from("physical_test_results").delete().eq("user_id", user_id),
      adminClient.from("mental_assessments").delete().eq("user_id", user_id),
      adminClient.from("user_recipes").delete().eq("user_id", user_id),
      adminClient.from("user_exercises").delete().eq("user_id", user_id),
      adminClient.from("workout_logs").delete().eq("user_id", user_id),
      adminClient.from("profiles").delete().eq("user_id", user_id),
      adminClient.from("user_roles").delete().eq("user_id", user_id),
      adminClient.from("coach_athletes").delete().eq("athlete_id", user_id),
      adminClient.from("coach_athletes").delete().eq("coach_id", user_id),
      adminClient.from("training_plans").delete().eq("user_id", user_id),
      adminClient.from("rehab_plans").delete().eq("user_id", user_id),
    ]);

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
