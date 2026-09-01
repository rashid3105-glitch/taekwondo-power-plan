import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClub } from "@/contexts/ActiveClubContext";

/**
 * Number of today's shared training logs in the active club that no coach has
 * replied to yet. Used for the coach bottom-nav badge and the CoachToday
 * shortcut line.
 */
export function useCoachLogCount(enabled: boolean) {
  const { activeClubId, primaryClubId } = useActiveClub();
  const clubId = activeClubId ?? primaryClubId ?? null;
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!enabled || !clubId) { setCount(0); return; }
    const today = new Date().toISOString().slice(0, 10);
    const { data: entries } = await supabase
      .from("diary_entries")
      .select("id, is_private, entry_type, entry_types")
      .eq("entry_date", today)
      .eq("club_id", clubId)
      .limit(500);

    const list = ((entries as any[]) || []).filter(
      (e) => e.is_private !== true &&
        (e.entry_type === "training" || ((e.entry_types as string[]) || []).includes("training")),
    );
    if (list.length === 0) { setCount(0); return; }

    const { data: comments } = await supabase
      .from("diary_comments" as any)
      .select("diary_entry_id")
      .in("diary_entry_id", list.map((e) => e.id));

    const handled = new Set(((comments as any[]) || []).map((c) => c.diary_entry_id));
    setCount(list.filter((e) => !handled.has(e.id)).length);
  }, [enabled, clubId]);

  useEffect(() => { void load(); }, [load]);

  return { count, refresh: load };
}
