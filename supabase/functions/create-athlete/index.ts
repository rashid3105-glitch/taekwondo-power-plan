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

    // Verify the calling user is a coach
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check coach role
    const { data: hasCoachRole } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "coach",
    });
    const { data: isAdmin } = await adminClient.rpc("is_admin", {
      _user_id: user.id,
    });
    if (!hasCoachRole && !isAdmin) throw new Error("Not a coach");

    // Enforce 5-athlete limit for non-admin coaches
    if (!isAdmin) {
      const { count } = await adminClient
        .from("coach_athletes")
        .select("id", { count: "exact", head: true })
        .eq("coach_id", user.id);
      if ((count ?? 0) >= 5) {
        throw new Error("MAX_ATHLETES_REACHED");
      }
    }

    const { data: coachProfile, error: coachProfileError } = await adminClient
      .from("profiles")
      .select("club_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (coachProfileError) throw coachProfileError;
    if (!coachProfile?.club_id) throw new Error("COACH_CLUB_REQUIRED");

    const { name, email, password, age, belt_level, experience_years, discipline } = await req.json();
    if (!name || !email || !password) throw new Error("Missing required fields");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    // Create the user account (email confirmed, but is_approved = false by default)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    });

    if (createError) throw createError;

    // Wait for the handle_new_user trigger to create the profile row
    let profileExists = false;
    for (let i = 0; i < 10; i++) {
      const { data: check } = await adminClient
        .from("profiles")
        .select("user_id")
        .eq("user_id", newUser.user!.id)
        .maybeSingle();
      if (check) { profileExists = true; break; }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!profileExists) {
      console.error("Profile not created by trigger after retries");
    }

    // Update profile with additional fields if provided
    const profileUpdates: Record<string, any> = {
      club_id: coachProfile.club_id,
    };
    if (age != null && typeof age === "number" && age >= 5 && age <= 99) profileUpdates.age = age;
    if (belt_level && typeof belt_level === "string") profileUpdates.belt_level = belt_level;
    if (experience_years != null && typeof experience_years === "number" && experience_years >= 0 && experience_years <= 50) profileUpdates.experience_years = experience_years;
    if (discipline && (discipline === "sparring" || discipline === "poomsae")) profileUpdates.discipline = discipline;

    const { error: updateError } = await adminClient.from("profiles").update(profileUpdates).eq("user_id", newUser.user!.id);
    if (updateError) console.error("Profile update error:", updateError);

    // Link athlete to coach
    await adminClient.from("coach_athletes").insert({
      coach_id: user.id,
      athlete_id: newUser.user!.id,
    });

    return new Response(
      JSON.stringify({ success: true, athlete_id: newUser.user!.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
