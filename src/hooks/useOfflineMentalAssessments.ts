// React hook providing local-first mental assessment list/submit/delete
// with background sync of queued submissions.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listCachedAssessments,
  replaceCachedAssessments,
  putCachedAssessment,
  deleteCachedAssessment,
  queueMentalAssessment,
  type CachedAssessment,
} from "@/lib/mentalAssessmentOfflineDB";
import { syncMentalAssessments } from "@/lib/mentalAssessmentSyncEngine";

interface SubmitInput {
  total_score: number;
  scores: Record<string, number>;
  answers: Record<string, number>;
  profile: any;
  language: string;
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Normalises ai_advice into an object/null. Older rows may store it as a
 * JSON string; bad data falls back to null so the UI can offer regeneration
 * instead of crashing on JSON.parse.
 */
function parseAdvice(raw: unknown): any | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return null;
}

export function useOfflineMentalAssessments() {
  const [assessments, setAssessments] = useState<CachedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAssessments([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    if (navigator.onLine) {
      const { data } = await supabase
        .from("mental_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        const cached: CachedAssessment[] = data.map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          total_score: a.total_score,
          scores: (a.scores as Record<string, number>) || {},
          answers: (a.answers as Record<string, number>) || {},
          ai_advice: parseAdvice(a.ai_advice),
          created_at: a.created_at,
          pending: false,
        }));
        await replaceCachedAssessments(user.id, cached);
      }
    }
    const local = await listCachedAssessments(user.id);
    setAssessments(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Sync on reconnect.
  useEffect(() => {
    const handler = async () => {
      const r = await syncMentalAssessments();
      if (r.flushed > 0) await refresh();
    };
    window.addEventListener("online", handler);
    if (navigator.onLine) void handler();
    return () => window.removeEventListener("online", handler);
  }, [refresh]);

  /**
   * Locally records an assessment and queues it for sync.
   * Returns the local placeholder id so the caller can render results
   * immediately.
   */
  const submitOffline = useCallback(
    async (input: SubmitInput) => {
      // Resolve user directly rather than relying on the userId state, which
      // may not be set yet if the component mounts and the user submits quickly.
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        uid = user.id;
        setUserId(uid);
      }
      const localId = uuid();
      const now = new Date().toISOString();
      const rec: CachedAssessment = {
        id: localId,
        user_id: uid,
        total_score: input.total_score,
        scores: input.scores,
        answers: input.answers,
        ai_advice: null,
        created_at: now,
        pending: true,
      };
      await putCachedAssessment(rec);
      await queueMentalAssessment({
        key: localId,
        user_id: uid,
        total_score: input.total_score,
        scores: input.scores,
        answers: input.answers,
        profile: input.profile,
        language: input.language,
        queued_at: Date.now(),
      });
      setAssessments(await listCachedAssessments(uid));

      if (navigator.onLine) {
        const r = await syncMentalAssessments();
        if (r.flushed > 0) {
          const fresh = await listCachedAssessments(uid);
          setAssessments(fresh);
          // Find the latest synced row (the previously-pending one is gone, the
          // newest non-pending row with matching scores is its replacement).
          const replaced = fresh.find(
            (a) => !a.pending && a.total_score === input.total_score,
          );
          return replaced || null;
        }
      }
      return rec;
    },
    [userId],
  );

  const removeAssessment = useCallback(
    async (id: string) => {
      if (!userId) return;
      // Server-side delete only when this row exists on the server.
      const target = assessments.find((a) => a.id === id);
      if (target && !target.pending && navigator.onLine) {
        await supabase.from("mental_assessments").delete().eq("id", id);
      }
      await deleteCachedAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    },
    [userId, assessments],
  );

  /**
   * Re-runs the AI advice generator for an existing assessment that is missing
   * personalised advice (e.g. the original generation failed).
   */
  const regenerateAdvice = useCallback(
    async (id: string, profile: any, language: string) => {
      if (!userId || !navigator.onLine) return null;
      const target = assessments.find((a) => a.id === id);
      if (!target || target.pending) return null;
      const { data, error } = await supabase.functions.invoke(
        "generate-mental-advice",
        {
          body: {
            answers: target.answers,
            scores: target.scores,
            totalScore: target.total_score,
            profile,
            language,
          },
        },
      );
      if (error || (data as any)?.error) return null;
      const advice = (data as any)?.advice ?? null;
      await supabase
        .from("mental_assessments")
        .update({ ai_advice: advice as any })
        .eq("id", id);
      const updated: CachedAssessment = { ...target, ai_advice: advice };
      await putCachedAssessment(updated);
      setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return advice;
    },
    [userId, assessments],
  );

  return {
    assessments,
    loading,
    submitOffline,
    removeAssessment,
    regenerateAdvice,
    refresh,
  };
}
