// Sync engine for offline diary entries.
// Flushes the outbox in queued order. Idempotent.

import { supabase } from "@/integrations/supabase/client";
import {
  listDiaryOutbox,
  removeDiaryIntent,
  putCachedEntry,
  deleteCachedEntry,
  queueDiaryIntent,
  type DiaryOutboxIntent,
} from "./diaryOfflineDB";

export interface DiarySyncResult {
  flushed: number;
  failed: number;
  errors: string[];
}

let syncing = false;

// Remap a local placeholder id to a real server id across queued intents.
async function remapLocalId(oldId: string, newId: string) {
  const intents = await listDiaryOutbox();
  for (const i of intents) {
    if (i.server_id === oldId || i.key === oldId) {
      const updated: DiaryOutboxIntent = { ...i, server_id: newId };
      await queueDiaryIntent(updated);
    }
  }
}

export async function syncDiary(): Promise<DiarySyncResult> {
  const result: DiarySyncResult = { flushed: 0, failed: 0, errors: [] };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    const intents = (await listDiaryOutbox()).sort((a, b) => a.queued_at - b.queued_at);
    for (const intent of intents) {
      try {
        if (intent.op === "create") {
          const { data, error } = await supabase
            .from("diary_entries")
            .insert({
              user_id: intent.user_id,
              entry_date: intent.entry_date,
              content: intent.content,
              mood: intent.mood,
              energy: intent.energy,
              tags: intent.tags,
              entry_type: intent.entry_type,
            })
            .select()
            .single();
          if (error) throw error;
          const newId = (data as { id: string }).id;
          await deleteCachedEntry(intent.key);
          await putCachedEntry({
            id: newId,
            user_id: intent.user_id,
            entry_date: (data as any).entry_date,
            content: (data as any).content,
            mood: (data as any).mood,
            energy: (data as any).energy,
            tags: ((data as any).tags as string[]) || [],
            entry_type: ((data as any).entry_type as any) || "general",
            created_at: (data as any).created_at,
            updated_at: (data as any).updated_at,
            pending: false,
          });
          await remapLocalId(intent.key, newId);
        } else if (intent.op === "update") {
          const id = intent.server_id || intent.key;
          const { data, error } = await supabase
            .from("diary_entries")
            .update({
              entry_date: intent.entry_date,
              content: intent.content,
              mood: intent.mood,
              energy: intent.energy,
              tags: intent.tags,
              entry_type: intent.entry_type,
            })
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          await putCachedEntry({
            id,
            user_id: intent.user_id,
            entry_date: (data as any).entry_date,
            content: (data as any).content,
            mood: (data as any).mood,
            energy: (data as any).energy,
            tags: ((data as any).tags as string[]) || [],
            entry_type: ((data as any).entry_type as any) || "general",
            created_at: (data as any).created_at,
            updated_at: (data as any).updated_at,
            pending: false,
          });
        } else if (intent.op === "delete") {
          const id = intent.server_id || intent.key;
          const { error } = await supabase.from("diary_entries").delete().eq("id", id);
          if (error) throw error;
          await deleteCachedEntry(id);
        }
        await removeDiaryIntent(intent.key);
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
