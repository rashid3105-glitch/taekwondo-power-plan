// Shared hard-deletion routine used by the automated retention cleanup.
// Classification comes from deletion-lists.ts, the same lists used by
// delete-my-account / account-deletion-dry-run, so the manual and the
// automated path can never drift apart.
import { DELETED_USER_ID, HARD_DELETE, ANONYMIZE, STORAGE_BUCKETS } from "./deletion-lists.ts";

export interface PurgeResult {
  user_id: string;
  deleted_rows: number;
  anonymized_rows: number;
  storage_objects: number;
  errors: string[];
}

/** Hard-deletes one user: anonymize shared data, delete own data, remove files, delete the login. */
export async function purgeUser(admin: any, uid: string): Promise<PurgeResult> {
  const result: PurgeResult = {
    user_id: uid,
    deleted_rows: 0,
    anonymized_rows: 0,
    storage_objects: 0,
    errors: [],
  };

  if (uid === DELETED_USER_ID) {
    result.errors.push("refused:system_user");
    return result;
  }

  // 1) Anonymize shared / other people's data first.
  for (const { table, column, nullable } of ANONYMIZE) {
    try {
      const { count, error } = await admin
        .from(table)
        .update({ [column]: nullable ? null : DELETED_USER_ID }, { count: "exact" })
        .eq(column, uid)
        .neq(column, DELETED_USER_ID);
      if (error) throw error;
      result.anonymized_rows += count ?? 0;
    } catch (e) {
      result.errors.push(`anonymize:${table}.${column}`);
    }
  }

  // 2) Comments on the user's own diary entries (children of diary_entries).
  try {
    const { data: entries } = await admin.from("diary_entries").select("id").eq("user_id", uid);
    const entryIds = (entries ?? []).map((r: any) => r.id);
    if (entryIds.length > 0) {
      const { count, error } = await admin
        .from("diary_comments").delete({ count: "exact" }).in("diary_entry_id", entryIds);
      if (error) throw error;
      result.deleted_rows += count ?? 0;
    }
  } catch (e) {
    result.errors.push("delete:diary_comments");
  }

  // 3) The user's own data.
  for (const { table, column } of HARD_DELETE) {
    if (table === "diary_comments") continue;
    try {
      const { count, error } = await admin
        .from(table)
        .delete({ count: "exact" })
        .eq(column, uid)
        .neq(column, DELETED_USER_ID);
      if (error) throw error;
      result.deleted_rows += count ?? 0;
    } catch (e) {
      result.errors.push(`delete:${table}.${column}`);
    }
  }

  // 4) Profile row.
  try {
    const { error } = await admin.from("profiles").delete().eq("user_id", uid).neq("user_id", DELETED_USER_ID);
    if (error) throw error;
    result.deleted_rows += 1;
  } catch (e) {
    result.errors.push("delete:profiles");
  }

  // 5) Storage objects under the user's prefix.
  for (const { bucket, prefix } of STORAGE_BUCKETS) {
    try {
      const pfx = prefix(uid);
      while (true) {
        const { data, error } = await admin.storage.from(bucket).list(pfx, { limit: 1000 });
        if (error) throw error;
        if (!data || data.length === 0) break;
        const paths = data.map((o: any) => `${pfx}${o.name}`);
        const { error: rmErr } = await admin.storage.from(bucket).remove(paths);
        if (rmErr) throw rmErr;
        result.storage_objects += paths.length;
        if (data.length < 1000) break;
      }
    } catch (e) {
      result.errors.push(`storage:${bucket}`);
    }
  }

  // 6) The login itself.
  try {
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) throw error;
  } catch (e) {
    result.errors.push("auth:deleteUser");
  }

  return result;
}

/**
 * Deletes the health-related data of an athlete who left the club; the account stays.
 * Covers both structured health tables and free-text that can carry health details
 * (diary, reflections, coach feedback).
 */
export async function purgeHealthData(admin: any, uid: string): Promise<{ deleted_rows: number; errors: string[] }> {
  const HEALTH_TABLES: Array<{ table: string; column: string }> = [
    { table: "health_data", column: "user_id" },
    { table: "wearable_samples", column: "user_id" },
    { table: "wearable_daily_summary", column: "user_id" },
    { table: "wearable_connections", column: "user_id" },
    { table: "readiness_checkins", column: "user_id" },
    { table: "mental_assessments", column: "user_id" },
    { table: "rehab_plans", column: "user_id" },
    { table: "nutrition_logs", column: "user_id" },
    { table: "nutrition_plans", column: "user_id" },
    { table: "weight_logs", column: "user_id" },
    { table: "weight_goals", column: "user_id" },
    { table: "supplement_checks", column: "user_id" },
    { table: "physical_test_results", column: "user_id" },
    { table: "form_curve_weekly", column: "user_id" },
    // Free text that can contain health information about the athlete.
    // coach_mental_assessments.user_id is the assessment's subject row owner;
    // coach_reflection_comments / workout_log_feedback are keyed by athlete_id,
    // so the coach's authorship is irrelevant here — the athlete decides.
    { table: "competition_reflections", column: "user_id" },
    { table: "coach_mental_assessments", column: "user_id" },
    { table: "coach_reflection_comments", column: "athlete_id" },
    { table: "workout_log_feedback", column: "athlete_id" },
  ];
  let deleted_rows = 0;
  const errors: string[] = [];

  // Diary comments first (children of the athlete's own diary entries), then the entries.
  try {
    const { data: entries } = await admin.from("diary_entries").select("id").eq("user_id", uid);
    const entryIds = (entries ?? []).map((r: any) => r.id);
    if (entryIds.length > 0) {
      const { count, error } = await admin
        .from("diary_comments").delete({ count: "exact" }).in("diary_entry_id", entryIds);
      if (error) throw error;
      deleted_rows += count ?? 0;
    }
    const { count: entryCount, error: entryErr } = await admin
      .from("diary_entries").delete({ count: "exact" }).eq("user_id", uid);
    if (entryErr) throw entryErr;
    deleted_rows += entryCount ?? 0;
  } catch (e) {
    errors.push("health:diary_entries");
  }

  for (const { table, column } of HEALTH_TABLES) {
    try {
      const { count, error } = await admin.from(table).delete({ count: "exact" }).eq(column, uid);
      if (error) throw error;
      deleted_rows += count ?? 0;
    } catch (e) {
      errors.push(`health:${table}`);
    }
  }
  return { deleted_rows, errors };
}

