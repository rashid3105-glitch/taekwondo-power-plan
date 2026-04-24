// Sync engine for offline workout logs. Flushes the outbox to the workout_logs table.
// Idempotent — safe to call multiple times. Last-write-wins per composite key.

import { supabase } from "@/integrations/supabase/client";
import {
  listOutboxIntents,
  removeOutboxIntent,
  putLocalLog,
  getLocalLog,
} from "./workoutLogOfflineDB";

export interface WorkoutLogSyncResult {
  flushed: number;
  failed: number;
  errors: string[];
}

let syncing = false;

export async function syncWorkoutLogs(): Promise<WorkoutLogSyncResult> {
  const result: WorkoutLogSyncResult = { flushed: 0, failed: 0, errors: [] };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    const intents = await listOutboxIntents();
    for (const intent of intents) {
      try {
        // Look up cached server id (if we previously synced this exercise/day).
        const local = await getLocalLog(intent.key);
        let serverId = local?.server_id;

        // If we don't have a server id locally, query Supabase to detect an existing row.
        if (!serverId) {
          const { data: existing } = await supabase
            .from("workout_logs")
            .select("id")
            .eq("plan_id", intent.plan_id)
            .eq("day_index", intent.day_index)
            .eq("session_index", intent.session_index)
            .eq("exercise_index", intent.exercise_index)
            .eq("logged_date", intent.logged_date)
            .maybeSingle();
          if (existing?.id) serverId = existing.id as string;
        }

        if (serverId) {
          const { error } = await supabase
            .from("workout_logs")
            .update({
              completed: intent.completed,
              actual_sets: intent.actual_sets,
              actual_reps: intent.actual_reps,
              notes: intent.notes,
            })
            .eq("id", serverId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("workout_logs")
            .insert({
              user_id: intent.user_id,
              plan_id: intent.plan_id,
              day_index: intent.day_index,
              session_index: intent.session_index,
              exercise_index: intent.exercise_index,
              logged_date: intent.logged_date,
              completed: intent.completed,
              actual_sets: intent.actual_sets,
              actual_reps: intent.actual_reps,
              notes: intent.notes,
            })
            .select("id")
            .single();
          if (error) throw error;
          serverId = (data as { id: string }).id;
        }

        // Persist server id + clear dirty flag locally.
        await putLocalLog({
          key: intent.key,
          user_id: intent.user_id,
          plan_id: intent.plan_id,
          day_index: intent.day_index,
          session_index: intent.session_index,
          exercise_index: intent.exercise_index,
          logged_date: intent.logged_date,
          completed: intent.completed,
          actual_sets: intent.actual_sets,
          actual_reps: intent.actual_reps,
          notes: intent.notes,
          server_id: serverId,
          dirty: false,
          updated_at: Date.now(),
        });
        await removeOutboxIntent(intent.key);
        result.flushed += 1;
      } catch (e: any) {
        result.failed += 1;
        result.errors.push(e?.message || String(e));
      }
    }
  } finally {
    syncing = false;
  }
  return result;
}
