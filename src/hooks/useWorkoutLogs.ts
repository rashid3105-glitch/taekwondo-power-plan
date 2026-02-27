import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkoutLog {
  id?: string;
  plan_id: string;
  day_index: number;
  exercise_index: number;
  completed: boolean;
  actual_sets: number | null;
  actual_reps: string | null;
  notes: string | null;
  logged_date: string;
}

export function useWorkoutLogs(planId: string, dayIndex: number | null) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const loadLogs = useCallback(async () => {
    if (dayIndex === null) return;
    setLoading(true);
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("plan_id", planId)
      .eq("day_index", dayIndex)
      .eq("logged_date", today);
    if (data) setLogs(data as unknown as WorkoutLog[]);
    setLoading(false);
  }, [planId, dayIndex, today]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const upsertLog = useCallback(
    async (exerciseIndex: number, updates: Partial<WorkoutLog>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existing = logs.find((l) => l.exercise_index === exerciseIndex);

      if (existing?.id) {
        const { data } = await supabase
          .from("workout_logs")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();
        if (data) {
          setLogs((prev) =>
            prev.map((l) => (l.id === existing.id ? (data as unknown as WorkoutLog) : l))
          );
        }
      } else {
        const { data } = await supabase
          .from("workout_logs")
          .insert({
            user_id: user.id,
            plan_id: planId,
            day_index: dayIndex!,
            exercise_index: exerciseIndex,
            completed: false,
            logged_date: today,
            ...updates,
          })
          .select()
          .single();
        if (data) {
          setLogs((prev) => [...prev, data as unknown as WorkoutLog]);
        }
      }
    },
    [logs, planId, dayIndex, today]
  );

  const getLog = useCallback(
    (exerciseIndex: number) => logs.find((l) => l.exercise_index === exerciseIndex),
    [logs]
  );

  return { logs, loading, upsertLog, getLog, today };
}
