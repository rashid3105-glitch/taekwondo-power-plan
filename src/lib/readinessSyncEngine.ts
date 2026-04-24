// Sync engine for offline readiness check-ins.
// Calls the submit-readiness edge function for each queued intent.

import { supabase } from "@/integrations/supabase/client";
import {
  listReadinessOutbox,
  removeReadinessIntent,
  putCachedCheckin,
} from "./readinessOfflineDB";

export interface ReadinessSyncResult {
  flushed: number;
  failed: number;
  errors: string[];
}

let syncing = false;

export async function syncReadiness(): Promise<ReadinessSyncResult> {
  const result: ReadinessSyncResult = { flushed: 0, failed: 0, errors: [] };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    const intents = (await listReadinessOutbox()).sort((a, b) => a.queued_at - b.queued_at);
    for (const intent of intents) {
      try {
        const { data, error } = await supabase.functions.invoke("submit-readiness", {
          body: {
            sleep_hours: intent.sleep_hours,
            soreness: intent.soreness,
            mood: intent.mood,
            motivation: intent.motivation,
            is_sick: intent.is_sick,
          },
        });
        if (error || (data as any)?.error) {
          throw new Error((data as any)?.error || error?.message);
        }
        const row = data as { score: number; recommendation: string; checkin_date: string };
        await putCachedCheckin(intent.user_id, row.checkin_date, {
          score: row.score,
          recommendation: row.recommendation as "green" | "amber" | "red",
          pending: false,
        });
        await removeReadinessIntent(intent.key);
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
