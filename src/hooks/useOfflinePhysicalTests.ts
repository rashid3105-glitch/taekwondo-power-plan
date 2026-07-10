// React hook providing offline-first physical test results.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listCachedResults,
  replaceCachedResults,
  putCachedResult,
  deleteCachedResult,
  queueTestIntent,
  removeTestIntent,
  type CachedTestResult,
} from "@/lib/physicalTestOfflineDB";
import { syncPhysicalTests } from "@/lib/physicalTestSyncEngine";
import { useActiveClub } from "@/contexts/ActiveClubContext";

export interface NewTestInput {
  user_id: string;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  test_type: string;
  tested_by: string | null;
  notes: string;
  test_date: string;
  session_id?: string | null;
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useOfflinePhysicalTests(targetUserId: string | null) {
  const [results, setResults] = useState<CachedTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeClubId } = useActiveClub();

  const refresh = useCallback(async () => {
    if (!targetUserId) {
      setResults([]);
      setLoading(false);
      return;
    }
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("physical_test_results" as any)
        .select("*")
        .eq("user_id", targetUserId)
        .order("test_date", { ascending: false });
      if (!error && data) {
        const mapped: CachedTestResult[] = (data as any[]).map((r) => ({
          local_id: r.id,
          server_id: r.id,
          user_id: r.user_id,
          test_name: r.test_name,
          category: r.category,
          value: r.value,
          unit: r.unit,
          test_type: r.test_type,
          tested_by: r.tested_by,
          notes: r.notes || "",
          test_date: r.test_date,
          pending: false,
          created_at: new Date(r.created_at || r.test_date).getTime(),
        }));
        await replaceCachedResults(targetUserId, mapped);
      }
    }
    const local = await listCachedResults(targetUserId);
    setResults(local);
    setLoading(false);
  }, [targetUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = async () => {
      const r = await syncPhysicalTests();
      if (r.flushed > 0) await refresh();
    };
    window.addEventListener("online", handler);
    if (navigator.onLine) void handler();
    return () => window.removeEventListener("online", handler);
  }, [refresh]);

  const addResult = useCallback(
    async (input: NewTestInput) => {
      const localId = uuid();
      const rec: CachedTestResult = {
        local_id: localId,
        user_id: input.user_id,
        test_name: input.test_name,
        category: input.category,
        value: input.value,
        unit: input.unit,
        test_type: input.test_type,
        tested_by: input.tested_by,
        notes: input.notes,
        test_date: input.test_date,
        pending: true,
        created_at: Date.now(),
      };
      await putCachedResult(rec);
      await queueTestIntent({
        key: localId,
        ...input,
        club_id: activeClubId ?? null,
        queued_at: Date.now(),
      });
      setResults(await listCachedResults(input.user_id));
      if (navigator.onLine) {
        const r = await syncPhysicalTests();
        if (r.flushed > 0) setResults(await listCachedResults(input.user_id));
      }
    },
    [activeClubId],
  );

  const removeResult = useCallback(
    async (localId: string) => {
      const existing = results.find((r) => r.local_id === localId);
      await deleteCachedResult(localId);
      await removeTestIntent(localId);
      setResults((prev) => prev.filter((r) => r.local_id !== localId));
      if (existing?.server_id && navigator.onLine) {
        await supabase
          .from("physical_test_results" as any)
          .delete()
          .eq("id", existing.server_id);
      }
    },
    [results],
  );

  const updateResult = useCallback(
    async (localId: string, patch: Partial<Pick<NewTestInput, "value" | "unit" | "notes">>) => {
      const existing = (await listCachedResults(targetUserId ?? "")).find(r => r.local_id === localId);
      if (!existing) return;
      const updated: CachedTestResult = { ...existing, ...patch };
      await putCachedResult(updated);
      setResults(await listCachedResults(targetUserId ?? ""));
      if (existing.server_id && navigator.onLine) {
        await supabase
          .from("physical_test_results" as any)
          .update({ value: updated.value, unit: updated.unit, notes: updated.notes } as any)
          .eq("id", existing.server_id);
      }
    },
    [targetUserId, results]
  );

  return { results, loading, addResult, removeResult, updateResult, refresh };
}
