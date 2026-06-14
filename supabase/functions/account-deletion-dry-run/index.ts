// Auth-required edge function: counts (but does NOT delete) what a real
// account deletion would touch for the calling user. Returns a structured
// summary so the user can see what will happen before they confirm.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rows in these tables that match the calling user on the given column
// represent the user's OWN data and will be HARD-DELETED.
const HARD_DELETE: Array<{ table: string; column: string }> = [
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
  { table: "user_passkeys", column: "user_id" },
  { table: "webauthn_challenges", column: "user_id" },
  { table: "subscriptions", column: "user_id" },
  { table: "consent_records", column: "athlete_id" },
  { table: "consent_tokens", column: "athlete_id" },
  { table: "parent_athletes", column: "athlete_id" },
  { table: "parent_invites", column: "athlete_id" },
  { table: "survey_responses", column: "athlete_id" },
  { table: "survey_recipients", column: "athlete_id" },
  { table: "survey_anonymous_history", column: "athlete_id" },
  { table: "club_memberships", column: "user_id" },
  { table: "club_athlete_season_overrides", column: "athlete_id" },
  { table: "club_season_plan_visibility", column: "athlete_id" },
  { table: "competition_reflection_requests", column: "athlete_id" },
  { table: "event_reminders", column: "athlete_id" },
  { table: "video_notes", column: "user_id" },
  { table: "match_videos", column: "athlete_id" },
  { table: "chat_reactions", column: "user_id" },
  { table: "chat_thread_members", column: "user_id" },
  { table: "ai_assistant_logs", column: "user_id" },
  { table: "user_roles", column: "user_id" },
  { table: "workout_log_feedback", column: "athlete_id" },
  { table: "coach_athletes", column: "athlete_id" },
  { table: "diary_comments", column: "diary_entry_id" /* counted via diary_entries */ },
];

// Rows in these tables touch shared/other people's data. They will be
// ANONYMIZED (FK nulled or author replaced) rather than deleted.
const ANONYMIZE: Array<{ table: string; column: string }> = [
  { table: "coach_athlete_notes", column: "coach_id" },
  { table: "coach_athlete_notes", column: "athlete_id" },
  { table: "coach_messages", column: "coach_id" },
  { table: "coach_messages", column: "athlete_id" },
  { table: "coach_reflection_comments", column: "coach_id" },
  { table: "coach_reflection_comments", column: "athlete_id" },
  { table: "diary_comments", column: "coach_id" },
  { table: "chat_messages", column: "sender_id" },
  { table: "chat_threads", column: "created_by" },
  { table: "video_annotations", column: "created_by" },
  { table: "match_tags", column: "created_by" },
  { table: "club_season_plans", column: "created_by" },
  { table: "club_techniques", column: "created_by" },
  { table: "club_week_technique_focus", column: "created_by" },
  { table: "survey_templates", column: "coach_id" },
  { table: "surveys", column: "coach_id" },
  { table: "coach_athletes", column: "coach_id" },
  { table: "session_attendance", column: "coach_id" },
  { table: "athlete_week_technique_focus", column: "created_by" },
  { table: "coach_invites", column: "coach_id" },
  { table: "coach_license_fields", column: "coach_id" },
];

const STORAGE_BUCKETS: Array<{ bucket: string; prefix: (uid: string) => string }> = [
  { bucket: "avatars", prefix: (uid) => `${uid}/` },
  { bucket: "match_videos", prefix: (uid) => `${uid}/` },
  { bucket: "chat-attachments", prefix: (uid) => `${uid}/` },
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

    const hard_delete: Array<{ table: string; column: string; count: number; error?: string }> = [];
    const anonymize: Array<{ table: string; column: string; count: number; error?: string }> = [];

    for (const { table, column } of HARD_DELETE) {
      try {
        if (table === "diary_comments") {
          // Counted via diary_entries ownership chain (the user's diary entries).
          const { data: entryIds } = await admin
            .from("diary_entries").select("id").eq("user_id", uid);
          const ids = (entryIds ?? []).map((r: any) => r.id);
          if (ids.length === 0) {
            hard_delete.push({ table, column: "via diary_entries.user_id", count: 0 });
          } else {
            const { count, error } = await admin
              .from("diary_comments")
              .select("*", { count: "exact", head: true })
              .in("diary_entry_id", ids);
            if (error) throw error;
            hard_delete.push({ table, column: "via diary_entries.user_id", count: count ?? 0 });
          }
          continue;
        }
        const { count, error } = await admin
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq(column, uid);
        if (error) throw error;
        hard_delete.push({ table, column, count: count ?? 0 });
      } catch (e) {
        hard_delete.push({ table, column, count: 0, error: String((e as Error)?.message ?? e) });
      }
    }

    for (const { table, column } of ANONYMIZE) {
      try {
        const { count, error } = await admin
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq(column, uid);
        if (error) throw error;
        anonymize.push({ table, column, count: count ?? 0 });
      } catch (e) {
        anonymize.push({ table, column, count: 0, error: String((e as Error)?.message ?? e) });
      }
    }

    const storage: Array<{ bucket: string; estimated_objects: number; error?: string }> = [];
    for (const { bucket, prefix } of STORAGE_BUCKETS) {
      try {
        const { data, error } = await admin.storage.from(bucket).list(prefix(uid), { limit: 1000 });
        if (error) throw error;
        storage.push({ bucket, estimated_objects: data?.length ?? 0 });
      } catch (e) {
        storage.push({ bucket, estimated_objects: 0, error: String((e as Error)?.message ?? e) });
      }
    }

    const total_hard = hard_delete.reduce((s, r) => s + (r.count || 0), 0);
    const total_anonymize = anonymize.reduce((s, r) => s + (r.count || 0), 0);
    const total_storage = storage.reduce((s, r) => s + (r.estimated_objects || 0), 0);

    return json({
      user: { id: uid, email: user.email },
      hard_delete,
      anonymize,
      storage,
      total_hard,
      total_anonymize,
      total_storage,
      total_hard_tables: hard_delete.filter((r) => r.count > 0).length,
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
