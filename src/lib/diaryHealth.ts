import { supabase } from "@/integrations/supabase/client";

/**
 * Coach-facing diary views must never read mood/energy straight from
 * diary_entries. They select entries WITHOUT those columns and attach them
 * here via diary_health_fields(), which returns NULL when the athlete has
 * no health-data consent (GDPR art. 9). The athlete always sees own values.
 */
export async function attachDiaryHealth<T extends { id: string }>(
  rows: T[],
): Promise<(T & { mood: number | null; energy: number | null })[]> {
  if (!rows.length) return [];
  const map = new Map<string, { mood: number | null; energy: number | null }>();
  const ids = rows.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 500) {
    const { data } = await supabase.rpc("diary_health_fields" as any, { _entry_ids: ids.slice(i, i + 500) });
    for (const h of ((data as any[]) || [])) map.set(h.id, { mood: h.mood ?? null, energy: h.energy ?? null });
  }
  return rows.map((r) => ({ ...r, mood: map.get(r.id)?.mood ?? null, energy: map.get(r.id)?.energy ?? null }));
}

/** Own health-data consent (for hiding mood/energy inputs). */
export async function fetchOwnHealthConsent(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_health_consent" as any, { _athlete: userId });
  if (error) return false;
  return data === true;
}

/**
 * Writes the health part (mood/energy) of a diary entry to diary_entry_health.
 * Separate from the diary text so the text always saves. Both null → row removed.
 * An RLS/consent rejection is dropped (logged, no retry) and returns false.
 */
export async function saveDiaryHealth(
  entryId: string,
  userId: string,
  mood: number | null | undefined,
  energy: number | null | undefined,
): Promise<boolean> {
  const m = mood ?? null;
  const e = energy ?? null;
  try {
    if (m == null && e == null) {
      await supabase.from("diary_entry_health" as any).delete().eq("entry_id", entryId);
      return true;
    }
    const { error } = await supabase
      .from("diary_entry_health" as any)
      .upsert({ entry_id: entryId, user_id: userId, mood: m, energy: e } as any, { onConflict: "entry_id" });
    if (error) throw error;
    return true;
  } catch (err: any) {
    const msg = `${err?.code ?? ""} ${err?.message ?? ""}`;
    if (/42501|row-level security|consent/i.test(msg)) {
      console.info("[diary] health part dropped: no health-data consent");
      return false;
    }
    throw err;
  }
}

/** Reads mood/energy from an embedded diary_entry_health relation. */
export function healthFromEmbed(row: any): { mood: number | null; energy: number | null } {
  const h = Array.isArray(row?.diary_entry_health) ? row.diary_entry_health[0] : row?.diary_entry_health;
  return { mood: h?.mood ?? null, energy: h?.energy ?? null };
}
