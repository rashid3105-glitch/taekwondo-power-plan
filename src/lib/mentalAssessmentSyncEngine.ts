// Sync engine for offline mental assessments.
// For each queued submission: invoke generate-mental-advice, then insert the
// final row into mental_assessments. Updates the local cache to clear the
// pending flag and remap the placeholder id to the server-assigned id.

import { supabase } from "@/integrations/supabase/client";
import {
  listMentalAssessmentOutbox,
  removeMentalAssessmentIntent,
  putCachedAssessment,
  deleteCachedAssessment,
} from "./mentalAssessmentOfflineDB";

export interface MentalAssessmentSyncResult {
  flushed: number;
  failed: number;
  errors: string[];
}

let syncing = false;

export async function syncMentalAssessments(): Promise<MentalAssessmentSyncResult> {
  const result: MentalAssessmentSyncResult = { flushed: 0, failed: 0, errors: [] };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    const intents = (await listMentalAssessmentOutbox()).sort(
      (a, b) => a.queued_at - b.queued_at,
    );
    for (const intent of intents) {
      try {
        // 1) Ask the edge function for personalized advice.
        const { data: adviceData, error: adviceErr } = await supabase.functions.invoke(
          "generate-mental-advice",
          {
            body: {
              answers: intent.answers,
              scores: intent.scores,
              totalScore: intent.total_score,
              profile: intent.profile,
              language: intent.language,
            },
          },
        );
        if (adviceErr || (adviceData as any)?.error) {
          throw new Error((adviceData as any)?.error || adviceErr?.message);
        }
        const advice = (adviceData as any)?.advice ?? null;

        // 2) Insert the assessment row.
        const { data: inserted, error: insertErr } = await supabase
          .from("mental_assessments")
          .insert({
            user_id: intent.user_id,
            answers: intent.answers,
            scores: intent.scores,
            total_score: intent.total_score,
            ai_advice: advice,
          } as any)
          .select("id, created_at")
          .single();
        if (insertErr) throw insertErr;
        const serverId = (inserted as any).id as string;
        const serverCreatedAt = (inserted as any).created_at as string;

        // 3) Replace the local placeholder row with the server-backed one.
        await deleteCachedAssessment(intent.key);
        await putCachedAssessment({
          id: serverId,
          user_id: intent.user_id,
          total_score: intent.total_score,
          scores: intent.scores,
          answers: intent.answers,
          ai_advice: advice,
          created_at: serverCreatedAt,
          pending: false,
        });
        await removeMentalAssessmentIntent(intent.key);
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
