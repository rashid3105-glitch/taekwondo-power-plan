import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ExerciseFeedback {
  id: string;
  workout_log_id: string;
  coach_id: string;
  athlete_id: string;
  comment: string;
  reaction: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Loads feedback for a set of workout_log ids. Used by both athletes (read-only,
 * with mark-as-read) and coaches (full CRUD via separate helpers below).
 */
export function useExerciseFeedback(logIds: string[]) {
  const [items, setItems] = useState<ExerciseFeedback[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (logIds.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("workout_log_feedback")
      .select("*")
      .in("workout_log_id", logIds)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as ExerciseFeedback[]);
    setLoading(false);
  }, [logIds.join("|")]);

  useEffect(() => { void load(); }, [load]);

  const byLog = useCallback(
    (workoutLogId: string) => items.filter((i) => i.workout_log_id === workoutLogId),
    [items]
  );

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)));
    await supabase.rpc("mark_workout_feedback_read", { _feedback_id: id });
  }, []);

  return { items, byLog, loading, refresh: load, markRead };
}

export async function upsertFeedback(params: {
  id?: string;
  workout_log_id: string;
  athlete_id: string;
  comment: string;
  reaction: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (params.id) {
    const { data, error } = await supabase
      .from("workout_log_feedback")
      .update({ comment: params.comment, reaction: params.reaction })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return data as ExerciseFeedback;
  }
  const { data, error } = await supabase
    .from("workout_log_feedback")
    .insert({
      workout_log_id: params.workout_log_id,
      athlete_id: params.athlete_id,
      coach_id: user.id,
      comment: params.comment,
      reaction: params.reaction,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ExerciseFeedback;
}

export async function deleteFeedback(id: string) {
  await supabase.from("workout_log_feedback").delete().eq("id", id);
}
