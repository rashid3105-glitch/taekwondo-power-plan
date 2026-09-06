import { supabase } from "@/integrations/supabase/client";

export type TrainingStatusValue = "cleared" | "cleared_with_limits" | "not_cleared";

export interface TrainingStatusRow {
  id: string;
  athlete_user_id: string;
  club_id: string | null;
  status: TrainingStatusValue;
  limitations: string | null;
  review_date: string | null;
  recorded_by: string;
  created_at: string;
}

/** Latest (current) training status for one athlete, or null if never recorded. */
export async function getLatestTrainingStatus(
  athleteUserId: string,
): Promise<TrainingStatusRow | null> {
  const { data, error } = await supabase
    .from("athlete_training_status" as any)
    .select("*")
    .eq("athlete_user_id", athleteUserId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return ((data as any[]) || [])[0] ?? null;
}

/** Latest status per athlete for a list of athletes (coach squad view). */
export async function getLatestTrainingStatuses(
  athleteUserIds: string[],
): Promise<Record<string, TrainingStatusRow>> {
  if (athleteUserIds.length === 0) return {};
  const { data, error } = await supabase
    .from("athlete_training_status" as any)
    .select("*")
    .in("athlete_user_id", athleteUserIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const out: Record<string, TrainingStatusRow> = {};
  for (const row of (data as any[]) || []) {
    if (!out[row.athlete_user_id]) out[row.athlete_user_id] = row;
  }
  return out;
}

/** Every update is inserted as a new row — history is never overwritten. */
export async function recordTrainingStatus(input: {
  athleteUserId: string;
  status: TrainingStatusValue;
  limitations?: string | null;
  reviewDate?: string | null;
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("not signed in");
  const { error } = await supabase.from("athlete_training_status" as any).insert({
    athlete_user_id: input.athleteUserId,
    status: input.status,
    limitations:
      input.status === "cleared_with_limits"
        ? (input.limitations || "").slice(0, 300) || null
        : null,
    review_date: input.reviewDate || null,
    recorded_by: uid,
  } as any);
  if (error) throw error;
}

export function isTrainingStatusOutdated(row: TrainingStatusRow | null): boolean {
  if (!row?.review_date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return row.review_date < today;
}

/** Noir & Gold palette — no plain red/amber/green. */
export function trainingStatusTone(status: TrainingStatusValue): string {
  switch (status) {
    case "cleared":
      return "border-primary/40 bg-primary/10 text-primary";
    case "cleared_with_limits":
      return "border-primary/30 bg-primary/5 text-primary/80";
    case "not_cleared":
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
}
