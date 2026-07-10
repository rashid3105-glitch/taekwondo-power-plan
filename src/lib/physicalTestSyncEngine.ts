// Sync engine for queued physical test inserts.

import { supabase } from "@/integrations/supabase/client";
import {
  listTestOutbox,
  removeTestIntent,
  listCachedResults,
  putCachedResult,
} from "./physicalTestOfflineDB";

export interface PhysicalTestSyncResult {
  flushed: number;
  failed: number;
}

let syncing = false;

export async function syncPhysicalTests(): Promise<PhysicalTestSyncResult> {
  const result: PhysicalTestSyncResult = { flushed: 0, failed: 0 };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    const intents = (await listTestOutbox()).sort((a, b) => a.queued_at - b.queued_at);
    for (const intent of intents) {
      try {
        const { data, error } = await supabase
          .from("physical_test_results" as any)
          .insert({
            user_id: intent.user_id,
            test_name: intent.test_name,
            category: intent.category,
            value: intent.value,
            unit: intent.unit,
            test_type: intent.test_type,
            tested_by: intent.tested_by,
            notes: intent.notes,
            test_date: intent.test_date,
            ...(intent.club_id ? { club_id: intent.club_id } : {}),
            ...(intent.session_id ? { session_id: intent.session_id } : {}),
          } as any)
          .select()
          .single();
        if (error) throw error;
        const serverId = (data as unknown as { id: string }).id;

        // Update the matching cached row with the server id and clear the pending flag.
        const cached = await listCachedResults(intent.user_id);
        const match = cached.find((r) => r.local_id === intent.key);
        if (match) {
          await putCachedResult({ ...match, server_id: serverId, pending: false });
        }
        await removeTestIntent(intent.key);
        result.flushed += 1;
      } catch {
        result.failed += 1;
      }
    }
  } finally {
    syncing = false;
  }
  return result;
}
