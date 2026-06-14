// Auth-required full data export (GDPR art. 15/20). Returns ALL the calling
// user's own data across the public schema as a single JSON document.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Same hard-delete map as account-deletion-dry-run: tables containing the
// user's OWN data. Each row will be exported with all columns.
const OWN_DATA: Array<{ table: string; column: string }> = [
  { table: "health_data", column: "user_id" },
  { table: "wearable_connections", column: "user_id" },
  { table: "wearable_daily_summary", column: "user_id" },
  { table: "wearable_samples", column: "user_id" },
  { table: "readiness_checkins", column: "user_id" },
  { table: "mental_assessments", column: "user_id" },
  { table: "physical_test_results", column: "user_id" },
  { table: "rehab_plans", column: "user_id" },
  { table: "nutrition_logs", column: "user_id" },
  { table: "nutrition_plans", column: "user_id" },
  { table: "weight_logs", column: "user_id" },
  { table: "supplement_checks", column: "user_id" },
  { table: "diary_entries", column: "user_id" },
  { table: "competition_reflections", column: "user_id" },
  { table: "competitions", column: "user_id" },
  { table: "season_plans", column: "user_id" },
  { table: "training_plans", column: "user_id" },
  { table: "workout_logs", column: "user_id" },
  { table: "form_curve_weekly", column: "user_id" },
  { table: "user_recipes", column: "user_id" },
  { table: "user_exercises", column: "user_id" },
  { table: "recipe_photo_overrides", column: "user_id" },
  { table: "athlete_achievements", column: "user_id" },
  { table: "athlete_highlight_videos", column: "user_id" },
  { table: "athlete_module_overrides", column: "athlete_id" },
  { table: "athlete_modules", column: "athlete_id" },
  { table: "athlete_week_technique_focus", column: "athlete_id" },
  { table: "notification_preferences", column: "user_id" },
  { table: "push_subscriptions", column: "user_id" },
  { table: "subscriptions", column: "user_id" },
  { table: "consent_records", column: "athlete_id" },
  { table: "parent_athletes", column: "athlete_id" },
  { table: "survey_responses", column: "athlete_id" },
  { table: "survey_recipients", column: "athlete_id" },
  { table: "club_memberships", column: "user_id" },
  { table: "club_athlete_season_overrides", column: "athlete_id" },
  { table: "competition_reflection_requests", column: "athlete_id" },
  { table: "event_reminders", column: "athlete_id" },
  { table: "video_notes", column: "user_id" },
  { table: "match_videos", column: "athlete_id" },
  { table: "user_roles", column: "user_id" },
  { table: "workout_log_feedback", column: "athlete_id" },
  { table: "coach_athletes", column: "athlete_id" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const uid = user.id;

    const { data: profile } = await admin
      .from("profiles").select("*").eq("user_id", uid).maybeSingle();

    const data: Record<string, unknown> = {};
    const errors: Array<{ table: string; error: string }> = [];

    for (const { table, column } of OWN_DATA) {
      try {
        const { data: rows, error } = await admin
          .from(table).select("*").eq(column, uid);
        if (error) throw error;
        data[table] = rows ?? [];
      } catch (e) {
        errors.push({ table, error: String((e as Error)?.message ?? e) });
        data[table] = [];
      }
    }

    const payload = {
      exported_at: new Date().toISOString(),
      user: { id: uid, email: user.email },
      profile,
      data,
      errors,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
