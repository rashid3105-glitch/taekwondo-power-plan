// Shared deletion classification used by both account-deletion-dry-run and
// delete-my-account so the two cannot drift. Keep these two lists in sync.

// The fixed "Deleted user" system profile. Anonymized NOT NULL columns are
// repointed to this id; nullable columns are set to NULL. This row MUST
// always exist (see migration) and must NEVER be deleted/anonymized.
export const DELETED_USER_ID = "00000000-0000-0000-0000-0000deadbeef";

// Rows in these tables that match the calling user on the given column
// represent the user's OWN data and will be HARD-DELETED.
export const HARD_DELETE: Array<{ table: string; column: string }> = [
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
  { table: "diary_comments", column: "diary_entry_id" /* via diary_entries */ },
];

// Rows in these tables touch shared/other people's data.
// They will be ANONYMIZED (FK nulled or author replaced) rather than deleted.
export const ANONYMIZE: Array<{ table: string; column: string; nullable: boolean }> = [
  { table: "coach_athlete_notes", column: "coach_id", nullable: false },
  { table: "coach_athlete_notes", column: "athlete_id", nullable: false },
  { table: "coach_messages", column: "coach_id", nullable: false },
  { table: "coach_messages", column: "athlete_id", nullable: false },
  { table: "coach_reflection_comments", column: "coach_id", nullable: false },
  { table: "coach_reflection_comments", column: "athlete_id", nullable: false },
  { table: "diary_comments", column: "coach_id", nullable: false },
  { table: "chat_messages", column: "sender_id", nullable: false },
  { table: "chat_threads", column: "created_by", nullable: false },
  { table: "video_annotations", column: "created_by", nullable: false },
  { table: "match_tags", column: "created_by", nullable: false },
  { table: "club_season_plans", column: "created_by", nullable: false },
  { table: "club_techniques", column: "created_by", nullable: true },
  { table: "club_week_technique_focus", column: "created_by", nullable: true },
  { table: "survey_templates", column: "coach_id", nullable: false },
  { table: "surveys", column: "coach_id", nullable: false },
  { table: "coach_athletes", column: "coach_id", nullable: false },
  { table: "session_attendance", column: "coach_id", nullable: false },
  { table: "athlete_week_technique_focus", column: "created_by", nullable: true },
  { table: "coach_invites", column: "coach_id", nullable: false },
  { table: "coach_license_fields", column: "coach_id", nullable: false },
];

export const STORAGE_BUCKETS: Array<{ bucket: string; prefix: (uid: string) => string }> = [
  { bucket: "avatars", prefix: (uid) => `${uid}/` },
  { bucket: "match_videos", prefix: (uid) => `${uid}/` },
  { bucket: "chat-attachments", prefix: (uid) => `${uid}/` },
];
