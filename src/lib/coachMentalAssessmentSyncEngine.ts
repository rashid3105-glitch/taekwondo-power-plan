// Sync engine for offline coach mental reviews. Mirrors the athlete sync
// engine but targets `coach_mental_assessments` and the
// `generate-coach-mental-advice` edge function.

import { supabase } from "@/integrations/supabase/client";
import {
  listCoachMentalAssessmentOutbox,
  removeCoachMentalAssessmentIntent,
  putCachedCoachAssessment,
  deleteCachedCoachAssessment,
} from "./coachMentalAssessmentOfflineDB";

export interface CoachMentalAssessmentSyncResult {
  flushed: number;
  failed: number;
  errors: string[];
}

let inFlight: Promise<CoachMentalAssessmentSyncResult> | null = null;

export async function syncCoachMentalAssessments(): Promise<CoachMentalAssessmentSyncResult> {
  if (inFlight) return inFlight;
  if (!navigator.onLine) return { flushed: 0, failed: 0, errors: [] };
  inFlight = (async (): Promise<CoachMentalAssessmentSyncResult> => {
    const result: CoachMentalAssessmentSyncResult = { flushed: 0, failed: 0, errors: [] };
    try {
    const intents = (await listCoachMentalAssessmentOutbox()).sort(
      (a, b) => a.queued_at - b.queued_at,
    );
    for (const intent of intents) {
      try {
        const { data: adviceData, error: adviceErr } = await supabase.functions.invoke(
          "generate-coach-mental-advice",
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

        const { data: inserted, error: insertErr } = await supabase
          .from("coach_mental_assessments")
          .insert({
            user_id: intent.user_id,
            answers: intent.answers,
            scores: intent.scores,
            total_score: Math.round(intent.total_score),
            ai_advice: advice ? JSON.stringify(advice) : null,
            language: intent.language,
          } as any)
          .select("id, created_at")
          .single();
        if (insertErr) throw insertErr;
        const serverId = (inserted as any).id as string;
        const serverCreatedAt = (inserted as any).created_at as string;

        await deleteCachedCoachAssessment(intent.key);
        await putCachedCoachAssessment({
          id: serverId,
          user_id: intent.user_id,
          total_score: intent.total_score,
          scores: intent.scores,
          answers: intent.answers,
          ai_advice: advice,
          created_at: serverCreatedAt,
          pending: false,
        });
        await removeCoachMentalAssessmentIntent(intent.key);
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
