// Sync engine for offline post-competition reflections.
// For each queued submission: invoke generate-competition-reflection,
// then insert the row into competition_reflections.

import { supabase } from "@/integrations/supabase/client";
import {
  listReflectionOutbox,
  removeReflectionIntent,
  putCachedReflection,
  deleteCachedReflection,
} from "./competitionReflectionOfflineDB";

export interface ReflectionSyncResult {
  flushed: number;
  failed: number;
  errors: string[];
}

let syncing = false;

export async function syncCompetitionReflections(): Promise<ReflectionSyncResult> {
  const result: ReflectionSyncResult = { flushed: 0, failed: 0, errors: [] };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    const intents = (await listReflectionOutbox()).sort(
      (a, b) => a.queued_at - b.queued_at,
    );
    for (const intent of intents) {
      try {
        // 1) Attempt AI plan (isolated — AI failure must not block INSERT).
        let plan: any = null;
        try {
          const { data: planData, error: planErr } = await supabase.functions.invoke(
            "generate-competition-reflection",
            {
              body: {
                ratings: intent.ratings,
                reflections: intent.reflections,
                competition: {
                  name: intent.competition_name,
                  date: intent.competition_date,
                  result: intent.result,
                },
                recentBaselineScores: intent.recentBaselineScores,
                profile: intent.profile,
                language: intent.language,
              },
            },
          );
          if (!planErr && !(planData as any)?.error) {
            plan = (planData as any)?.plan ?? null;
          }
        } catch (_) {
          // AI plan failed — proceed with plan=null; user will see "plan coming soon".
        }


        // 2) Insert row.
        const { data: inserted, error: insertErr } = await supabase
          .from("competition_reflections")
          .insert({
            user_id: intent.user_id,
            competition_id: intent.competition_id,
            competition_name: intent.competition_name,
            competition_date: intent.competition_date,
            result: intent.result,
            ratings: intent.ratings,
            reflections: intent.reflections,
            ai_plan: plan,
            next_competition_id: intent.next_competition_id,
            ...(intent.club_id ? { club_id: intent.club_id } : {}),
          } as any)
          .select("id, created_at")
          .single();
        if (insertErr) throw insertErr;
        const serverId = (inserted as any).id as string;
        const serverCreatedAt = (inserted as any).created_at as string;

        // 3) Replace local placeholder with synced row.
        await deleteCachedReflection(intent.key);
        await putCachedReflection({
          id: serverId,
          user_id: intent.user_id,
          competition_id: intent.competition_id,
          competition_name: intent.competition_name,
          competition_date: intent.competition_date,
          result: intent.result,
          ratings: intent.ratings,
          reflections: intent.reflections,
          ai_plan: plan,
          next_competition_id: intent.next_competition_id,
          created_at: serverCreatedAt,
          pending: false,
        });
        await removeReflectionIntent(intent.key);
        // Notify coaches — fire and forget
        supabase.functions.invoke("notify-coaches-athlete-activity", {
          body: {
            activity_type: "competition_reflection",
            competition_name: intent.competition_name || "",
          },
        }).catch(() => {});
        result.flushed += 1;
      } catch (e: any) {
        result.failed += 1;
        const msg = e?.message || String(e);
        result.errors.push(msg);
        // eslint-disable-next-line no-console
        console.warn("[competitionReflectionSync] intent failed", intent.key, msg);
      }
    }
  } finally {
    syncing = false;
  }
  return result;
}
