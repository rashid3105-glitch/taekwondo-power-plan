import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getLocalLog,
  listLocalLogsForSession,
  listOutboxIntents,
  makeLogKey,
  putLocalLog,
  queueLogIntent,
  type LocalLogRecord,
} from "@/lib/workoutLogOfflineDB";
import { syncWorkoutLogs } from "@/lib/workoutLogSyncEngine";

// Mirrors the shape consumed by AIPlanCard so this hook is drop-in compatible
// with the previous online-only useWorkoutLogs hook.
export interface WorkoutLog {
  id?: string;
  plan_id: string;
  day_index: number;
  session_index: number;
  exercise_index: number;
  completed: boolean;
  actual_sets: number | null;
  actual_reps: string | null;
  notes: string | null;
  logged_date: string;
}

function recordToLog(r: LocalLogRecord): WorkoutLog {
  return {
    id: r.server_id,
    plan_id: r.plan_id,
    day_index: r.day_index,
    session_index: r.session_index,
    exercise_index: r.exercise_index,
    completed: r.completed,
    actual_sets: r.actual_sets,
    actual_reps: r.actual_reps,
    notes: r.notes,
    logged_date: r.logged_date,
  };
}

export function useOfflineWorkoutLogs(
  planId: string,
  dayIndex: number | null,
  sessionIndex: number = 0,
) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const today = new Date().toISOString().split("T")[0];
  const userIdRef = useRef<string | null>(null);

  const refreshPending = useCallback(async () => {
    const intents = await listOutboxIntents();
    setPendingKeys(new Set(intents.map((i) => i.key)));
  }, []);

  const loadLogs = useCallback(async () => {
    if (dayIndex === null) return;
    setLoading(true);

    // 1. Always start from the local IndexedDB cache so the UI works offline.
    const local = await listLocalLogsForSession(planId, dayIndex, sessionIndex, today);
    setLogs(local.map(recordToLog));

    // 2. If online, refresh from server and reconcile non-dirty rows.
    if (navigator.onLine) {
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("plan_id", planId)
        .eq("day_index", dayIndex)
        .eq("session_index", sessionIndex)
        .eq("logged_date", today);

      if (data) {
        const localByExercise = new Map(local.map((r) => [r.exercise_index, r]));
        const merged: WorkoutLog[] = [];
        for (const row of data as any[]) {
          const existing = localByExercise.get(row.exercise_index);
          // If we have a dirty local copy, keep it (its edit will sync on reconnect).
          if (existing?.dirty) {
            merged.push(recordToLog(existing));
            continue;
          }
          const rec: LocalLogRecord = {
            key: makeLogKey(planId, dayIndex, sessionIndex, row.exercise_index, today),
            user_id: row.user_id,
            plan_id: row.plan_id,
            day_index: row.day_index,
            session_index: row.session_index,
            exercise_index: row.exercise_index,
            logged_date: row.logged_date,
            completed: row.completed,
            actual_sets: row.actual_sets,
            actual_reps: row.actual_reps,
            notes: row.notes,
            server_id: row.id,
            dirty: false,
            updated_at: Date.now(),
          };
          await putLocalLog(rec);
          merged.push(recordToLog(rec));
          localByExercise.delete(row.exercise_index);
        }
        // Keep any local-only (dirty) entries the server hasn't seen yet.
        for (const leftover of localByExercise.values()) {
          merged.push(recordToLog(leftover));
        }
        setLogs(merged);
      }
    }

    await refreshPending();
    setLoading(false);
  }, [planId, dayIndex, sessionIndex, today, refreshPending]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // Keep userId cached so we can write logs even when momentarily offline.
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, []);

  // Online/offline listeners — auto-flush on reconnect.
  useEffect(() => {
    const onOnline = async () => {
      setOnline(true);
      await syncWorkoutLogs();
      await refreshPending();
      void loadLogs();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // Best-effort initial sync if there are queued intents.
    if (navigator.onLine) {
      void syncWorkoutLogs().then(refreshPending);
    }
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [loadLogs, refreshPending]);

  const upsertLog = useCallback(
    async (exerciseIndex: number, updates: Partial<WorkoutLog>) => {
      if (dayIndex === null) return;
      const userId = userIdRef.current ?? (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      userIdRef.current = userId;

      const key = makeLogKey(planId, dayIndex, sessionIndex, exerciseIndex, today);
      const existing = await getLocalLog(key);

      const merged: LocalLogRecord = {
        key,
        user_id: userId,
        plan_id: planId,
        day_index: dayIndex,
        session_index: sessionIndex,
        exercise_index: exerciseIndex,
        logged_date: today,
        completed: updates.completed ?? existing?.completed ?? false,
        actual_sets:
          updates.actual_sets !== undefined ? updates.actual_sets : existing?.actual_sets ?? null,
        actual_reps:
          updates.actual_reps !== undefined ? updates.actual_reps : existing?.actual_reps ?? null,
        notes: updates.notes !== undefined ? updates.notes : existing?.notes ?? null,
        server_id: existing?.server_id,
        dirty: true,
        updated_at: Date.now(),
      };

      // 1. Local-first write so the UI updates immediately, even offline.
      await putLocalLog(merged);
      setLogs((prev) => {
        const without = prev.filter((l) => l.exercise_index !== exerciseIndex);
        return [...without, recordToLog(merged)];
      });

      // 2. Queue an intent (idempotent — same key collapses repeated edits).
      await queueLogIntent({
        key,
        user_id: userId,
        plan_id: planId,
        day_index: dayIndex,
        session_index: sessionIndex,
        exercise_index: exerciseIndex,
        logged_date: today,
        completed: merged.completed,
        actual_sets: merged.actual_sets,
        actual_reps: merged.actual_reps,
        notes: merged.notes,
        queued_at: Date.now(),
      });
      setPendingKeys((prev) => new Set(prev).add(key));

      // 3. If online, attempt to flush right away.
      if (navigator.onLine) {
        await syncWorkoutLogs();
        await refreshPending();
        // Refresh server_id back into local state.
        const after = await getLocalLog(key);
        if (after) {
          setLogs((prev) =>
            prev.map((l) => (l.exercise_index === exerciseIndex ? recordToLog(after) : l)),
          );
        }
      }
    },
    [planId, dayIndex, sessionIndex, today, refreshPending],
  );

  const getLog = useCallback(
    (exerciseIndex: number) => logs.find((l) => l.exercise_index === exerciseIndex),
    [logs],
  );

  const isPending = useCallback(
    (exerciseIndex: number) => {
      if (dayIndex === null) return false;
      return pendingKeys.has(makeLogKey(planId, dayIndex, sessionIndex, exerciseIndex, today));
    },
    [pendingKeys, planId, dayIndex, sessionIndex, today],
  );

  return { logs, loading, upsertLog, getLog, today, isPending, online };
}
