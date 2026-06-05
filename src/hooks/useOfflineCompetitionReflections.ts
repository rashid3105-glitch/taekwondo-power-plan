// React hook providing local-first post-competition reflection list/submit/delete
// with background sync of queued submissions.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listCachedReflections,
  replaceCachedReflections,
  putCachedReflection,
  deleteCachedReflection,
  queueReflection,
  listReflectionOutbox,
  type CachedReflection,
} from "@/lib/competitionReflectionOfflineDB";
import {
  syncCompetitionReflections,
  type ReflectionSyncResult,
} from "@/lib/competitionReflectionSyncEngine";
import { useActiveClub } from "@/contexts/ActiveClubContext";

interface SubmitInput {
  competition_id: string | null;
  competition_name: string | null;
  competition_date: string | null;
  result: string | null;
  ratings: Record<string, number>;
  reflections: Record<string, string>;
  next_competition_id: string | null;
  profile: any;
  language: string;
  recentBaselineScores: Record<string, number> | null;
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parsePlan(raw: unknown): any | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try { return JSON.parse(t); } catch { return null; }
  }
  return null;
}

export function useOfflineCompetitionReflections() {
  const [reflections, setReflections] = useState<CachedReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { activeClubId } = useActiveClub();

  const recountPending = useCallback(async () => {
    try {
      const out = await listReflectionOutbox();
      setPendingCount(out.length);
    } catch {
      // ignore — IndexedDB may be unavailable
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setReflections([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    if (navigator.onLine) {
      const { data } = await supabase
        .from("competition_reflections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        const cached: CachedReflection[] = data.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          competition_id: r.competition_id,
          competition_name: r.competition_name,
          competition_date: r.competition_date,
          result: r.result,
          ratings: (r.ratings as Record<string, number>) || {},
          reflections: (r.reflections as Record<string, string>) || {},
          ai_plan: parsePlan(r.ai_plan),
          next_competition_id: r.next_competition_id,
          created_at: r.created_at,
          pending: false,
        }));
        await replaceCachedReflections(user.id, cached);
      }
    }
    const local = await listCachedReflections(user.id);
    setReflections(local);
    await recountPending();
    setLoading(false);
  }, [recountPending]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Manual sync — used by "Sync now" button.
  const syncNow = useCallback(async (): Promise<ReflectionSyncResult> => {
    if (syncing) return { flushed: 0, failed: 0, errors: [] };
    setSyncing(true);
    try {
      const r = await syncCompetitionReflections();
      if (r.flushed > 0 || r.failed > 0) await refresh();
      return r;
    } finally {
      setSyncing(false);
    }
  }, [refresh, syncing]);

  // Sync on reconnect — toasts handled by callers via window event.
  useEffect(() => {
    const handler = async () => {
      const r = await syncCompetitionReflections();
      if (r.flushed > 0 || r.failed > 0) {
        await refresh();
        window.dispatchEvent(
          new CustomEvent("competition-reflection-sync", { detail: r }),
        );
      }
    };
    window.addEventListener("online", handler);
    if (navigator.onLine) void handler();
    return () => window.removeEventListener("online", handler);
  }, [refresh]);

  const submitOffline = useCallback(
    async (input: SubmitInput) => {
      if (!userId) return null;
      const localId = uuid();
      const now = new Date().toISOString();
      const rec: CachedReflection = {
        id: localId,
        user_id: userId,
        competition_id: input.competition_id,
        competition_name: input.competition_name,
        competition_date: input.competition_date,
        result: input.result,
        ratings: input.ratings,
        reflections: input.reflections,
        ai_plan: null,
        next_competition_id: input.next_competition_id,
        created_at: now,
        pending: true,
      };
      await putCachedReflection(rec);
      await queueReflection({
        key: localId,
        user_id: userId,
        competition_id: input.competition_id,
        competition_name: input.competition_name,
        competition_date: input.competition_date,
        result: input.result,
        ratings: input.ratings,
        reflections: input.reflections,
        next_competition_id: input.next_competition_id,
        ...(activeClubId ? { club_id: activeClubId } : {}),
        profile: input.profile,
        language: input.language,
        recentBaselineScores: input.recentBaselineScores,
        queued_at: Date.now(),
      });
      setReflections(await listCachedReflections(userId));
      await recountPending();

      if (navigator.onLine) {
        const r = await syncCompetitionReflections();
        await recountPending();
        // Fire-and-forget coach notification
        supabase.functions.invoke("notify-coaches-athlete-activity", {
          body: {
            activity_type: "competition_reflection",
            competition_name: input.competition_name || undefined,
          },
        }).catch(() => {});
        if (r.flushed > 0) {
          const fresh = await listCachedReflections(userId);
          setReflections(fresh);
          // Best-effort match the just-synced row by competition snapshot
          const replaced = fresh.find(
            (a) => !a.pending &&
              a.competition_name === input.competition_name &&
              a.competition_date === input.competition_date,
          );
          return replaced || null;
        }
        // Online but sync failed — keep pending; caller will toast accordingly.
      }
      return rec;
    },
    [userId, recountPending, activeClubId],
  );

  const removeReflection = useCallback(
    async (id: string) => {
      if (!userId) return;
      const target = reflections.find((r) => r.id === id);
      if (target && !target.pending && navigator.onLine) {
        await supabase.from("competition_reflections").delete().eq("id", id);
      }
      await deleteCachedReflection(id);
      setReflections((prev) => prev.filter((r) => r.id !== id));
    },
    [userId, reflections],
  );

  const updateNextCompetition = useCallback(
    async (id: string, nextCompetitionId: string | null) => {
      if (!userId) return;
      const target = reflections.find((r) => r.id === id);
      if (!target) return;
      if (!target.pending && navigator.onLine) {
        await supabase
          .from("competition_reflections")
          .update({ next_competition_id: nextCompetitionId })
          .eq("id", id);
      }
      const updated: CachedReflection = { ...target, next_competition_id: nextCompetitionId };
      await putCachedReflection(updated);
      setReflections((prev) => prev.map((r) => (r.id === id ? updated : r)));
    },
    [userId, reflections],
  );

  return {
    reflections,
    loading,
    pendingCount,
    syncing,
    submitOffline,
    removeReflection,
    updateNextCompetition,
    refresh,
    syncNow,
  };
}
