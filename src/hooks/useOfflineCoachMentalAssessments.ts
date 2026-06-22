// Local-first hook for coach mental reviews. Mirrors useOfflineMentalAssessments
// but reads/writes the `coach_mental_assessments` table.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listCachedCoachAssessments,
  replaceCachedCoachAssessments,
  putCachedCoachAssessment,
  deleteCachedCoachAssessment,
  queueCoachMentalAssessment,
  type CachedCoachAssessment,
} from "@/lib/coachMentalAssessmentOfflineDB";
import { syncCoachMentalAssessments } from "@/lib/coachMentalAssessmentSyncEngine";

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

function parseAdvice(raw: unknown): any | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try { return JSON.parse(trimmed); } catch { return null; }
  }
  return null;
}

export function useOfflineCoachMentalAssessments() {
  const [assessments, setAssessments] = useState<CachedCoachAssessment[]>([]);
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
        .from("coach_mental_assessments" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        const cached: CachedCoachAssessment[] = (data as any[]).map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          total_score: a.total_score,
          scores: (a.scores as Record<string, number>) || {},
          answers: (a.answers as Record<string, number>) || {},
          ai_advice: parseAdvice(a.ai_advice),
          created_at: a.created_at,
          pending: false,
        }));
        await replaceCachedCoachAssessments(user.id, cached);
      }
    }
    const local = await listCachedCoachAssessments(user.id);
    setAssessments(local);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const handler = async () => {
      const r = await syncCoachMentalAssessments();
      if (r.flushed > 0) await refresh();
    };
    window.addEventListener("online", handler);
    if (navigator.onLine) void handler();
    return () => window.removeEventListener("online", handler);
  }, [refresh]);

  const submitOffline = useCallback(
    async (input: SubmitInput) => {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        uid = user.id;
        setUserId(uid);
      }
      const localId = uuid();
      const now = new Date().toISOString();
      const rec: CachedCoachAssessment = {
        id: localId,
        user_id: uid,
        total_score: input.total_score,
        scores: input.scores,
        answers: input.answers,
        ai_advice: null,
        created_at: now,
        pending: true,
      };
      await putCachedCoachAssessment(rec);
      await queueCoachMentalAssessment({
        key: localId,
        user_id: uid,
        total_score: input.total_score,
        scores: input.scores,
        answers: input.answers,
        profile: input.profile,
        language: input.language,
        queued_at: Date.now(),
      });
      setAssessments(await listCachedCoachAssessments(uid));

      if (navigator.onLine) {
        const r = await syncCoachMentalAssessments();
        if (r.flushed > 0) {
          const fresh = await listCachedCoachAssessments(uid);
          setAssessments(fresh);
          const replaced = fresh.find(
            (a) => !a.pending && a.total_score === Math.round(input.total_score),
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
      const target = assessments.find((a) => a.id === id);
      if (target && !target.pending && navigator.onLine) {
        await supabase.from("coach_mental_assessments" as any).delete().eq("id", id);
      }
      await deleteCachedCoachAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    },
    [userId, assessments],
  );

  const regenerateAdvice = useCallback(
    async (id: string, profile: any, language: string) => {
      if (!userId || !navigator.onLine) return null;
      const target = assessments.find((a) => a.id === id);
      if (!target || target.pending) return null;
      const { data, error } = await supabase.functions.invoke(
        "generate-coach-mental-advice",
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
        .from("coach_mental_assessments" as any)
        .update({ ai_advice: advice ? JSON.stringify(advice) : null } as any)
        .eq("id", id);
      const updated: CachedCoachAssessment = { ...target, ai_advice: advice };
      await putCachedCoachAssessment(updated);
      setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return advice;
    },
    [userId, assessments],
  );

  return { assessments, loading, submitOffline, removeAssessment, regenerateAdvice, refresh };
}
