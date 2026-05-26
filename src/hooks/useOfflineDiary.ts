// React hook providing local-first diary CRUD with background sync.
// Reads/writes go through IndexedDB; the outbox is flushed whenever
// the network is available.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listCachedEntries,
  replaceCachedEntries,
  putCachedEntry,
  deleteCachedEntry,
  queueDiaryIntent,
  type CachedDiaryEntry,
  type DiaryEntryType,
} from "@/lib/diaryOfflineDB";
import { syncDiary } from "@/lib/diarySyncEngine";

interface NewEntry {
  entry_date: string;
  content: string;
  mood: number;
  energy: number;
  tags: string[];
  entry_type: DiaryEntryType;
  entry_types?: string[] | null;
  run_distance_km?: number | null;
  run_duration_seconds?: number | null;
  run_pace_seconds_per_km?: number | null;
  run_calories?: number | null;
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useOfflineDiary() {
  const [entries, setEntries] = useState<CachedDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load: prefer the network, fall back to the cache when offline.
  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    if (navigator.onLine) {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false });
      if (!error && data) {
        const cached: CachedDiaryEntry[] = data.map((e: any) => ({
          id: e.id,
          user_id: e.user_id,
          entry_date: e.entry_date,
          content: e.content,
          mood: e.mood,
          energy: e.energy,
          tags: (e.tags as string[]) || [],
          entry_type: (e.entry_type as DiaryEntryType) || "general",
          entry_types: (e.entry_types as string[] | null) ?? null,
          run_distance_km: e.run_distance_km ?? null,
          run_duration_seconds: e.run_duration_seconds ?? null,
          run_pace_seconds_per_km: e.run_pace_seconds_per_km ?? null,
          run_calories: e.run_calories ?? null,
          created_at: e.created_at,
          updated_at: e.updated_at,
          pending: false,
        }));
        await replaceCachedEntries(user.id, cached);
      }
    }
    const local = await listCachedEntries(user.id);
    setEntries(local);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Sync on reconnect.
  useEffect(() => {
    const handler = async () => {
      const r = await syncDiary();
      if (r.flushed > 0) await refresh();
    };
    window.addEventListener("online", handler);
    if (navigator.onLine) void handler();
    return () => window.removeEventListener("online", handler);
  }, [refresh]);

  const createEntry = useCallback(
    async (input: NewEntry) => {
      if (!userId) return;
      const localId = uuid();
      const now = new Date().toISOString();
      const rec: CachedDiaryEntry = {
        id: localId,
        user_id: userId,
        entry_date: input.entry_date,
        content: input.content,
        mood: input.mood,
        energy: input.energy,
        tags: input.tags,
        entry_type: input.entry_type,
        entry_types: input.entry_types ?? null,
        run_distance_km: input.run_distance_km ?? null,
        run_duration_seconds: input.run_duration_seconds ?? null,
        run_pace_seconds_per_km: input.run_pace_seconds_per_km ?? null,
        run_calories: input.run_calories ?? null,
        created_at: now,
        updated_at: now,
        pending: true,
      };
      await putCachedEntry(rec);
      await queueDiaryIntent({
        key: localId,
        op: "create",
        user_id: userId,
        ...input,
        queued_at: Date.now(),
      });
      setEntries(await listCachedEntries(userId));
      if (navigator.onLine) {
        const r = await syncDiary();
        if (r.flushed > 0) setEntries(await listCachedEntries(userId));
        // Fire-and-forget coach notification
        supabase.functions.invoke("notify-coaches-athlete-activity", {
          body: { activity_type: "diary" },
        }).catch(() => {});
      }
    },
    [userId],
  );

  const updateEntry = useCallback(
    async (id: string, input: NewEntry) => {
      if (!userId) return;
      const existing = entries.find((e) => e.id === id);
      const isLocalOnly = existing?.pending === true && id.startsWith("local-") === false
        ? false
        : !!existing?.pending;
      const now = new Date().toISOString();
      const rec: CachedDiaryEntry = {
        id,
        user_id: userId,
        entry_date: input.entry_date,
        content: input.content,
        mood: input.mood,
        energy: input.energy,
        tags: input.tags,
        entry_type: input.entry_type,
        run_distance_km: input.run_distance_km ?? null,
        run_duration_seconds: input.run_duration_seconds ?? null,
        run_pace_seconds_per_km: input.run_pace_seconds_per_km ?? null,
        run_calories: input.run_calories ?? null,
        created_at: existing?.created_at || now,
        updated_at: now,
        pending: true,
      };
      await putCachedEntry(rec);
      await queueDiaryIntent({
        key: id,
        op: isLocalOnly ? "create" : "update",
        user_id: userId,
        server_id: isLocalOnly ? undefined : id,
        ...input,
        queued_at: Date.now(),
      });
      setEntries(await listCachedEntries(userId));
      if (navigator.onLine) {
        const r = await syncDiary();
        if (r.flushed > 0) setEntries(await listCachedEntries(userId));
      }
    },
    [userId, entries],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!userId) return;
      const existing = entries.find((e) => e.id === id);
      await deleteCachedEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (existing?.pending) {
        await queueDiaryIntent({
          key: id,
          op: "delete",
          user_id: userId,
          server_id: undefined,
          entry_date: existing.entry_date,
          content: existing.content,
          mood: existing.mood,
          energy: existing.energy,
          tags: existing.tags,
          entry_type: existing.entry_type,
          queued_at: Date.now(),
        });
        const { removeDiaryIntent } = await import("@/lib/diaryOfflineDB");
        await removeDiaryIntent(id);
        return;
      }
      await queueDiaryIntent({
        key: id,
        op: "delete",
        user_id: userId,
        server_id: id,
        entry_date: existing?.entry_date || new Date().toISOString().slice(0, 10),
        content: existing?.content || "",
        mood: existing?.mood || 3,
        energy: existing?.energy || 3,
        tags: existing?.tags || [],
        entry_type: existing?.entry_type || "general",
        queued_at: Date.now(),
      });
      if (navigator.onLine) await syncDiary();
    },
    [userId, entries],
  );

  return { entries, loading, createEntry, updateEntry, removeEntry, refresh };
}
