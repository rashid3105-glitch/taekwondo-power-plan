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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userId = user.id;

    // Fetch all user data in parallel
    const [
      profileRes,
      trainingRes,
      rehabRes,
      workoutRes,
      exercisesRes,
      recipesRes,
      mentalRes,
      physicalRes,
      diaryRes,
    ] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", userId),
      adminClient.from("training_plans").select("*").eq("user_id", userId),
      adminClient.from("rehab_plans").select("*").eq("user_id", userId),
      adminClient.from("workout_logs").select("*").eq("user_id", userId),
      adminClient.from("user_exercises").select("*").eq("user_id", userId),
      adminClient.from("user_recipes").select("*").eq("user_id", userId),
      adminClient.from("mental_assessments").select("*").eq("user_id", userId),
      adminClient.from("physical_test_results").select("*").eq("user_id", userId),
      adminClient.from("diary_entries").select("*").eq("user_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_email: user.email,
      profile: profileRes.data ?? [],
      training_plans: trainingRes.data ?? [],
      rehab_plans: rehabRes.data ?? [],
      workout_logs: workoutRes.data ?? [],
      exercises: exercisesRes.data ?? [],
      recipes: recipesRes.data ?? [],
      mental_assessments: mentalRes.data ?? [],
      physical_test_results: physicalRes.data ?? [],
      diary_entries: diaryRes.data ?? [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
