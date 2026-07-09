import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listThreads, type ChatThread } from "@/lib/chatApi";

export function useThreads() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listThreads();
      setThreads(data);
    } catch (e) {
      console.error("[useThreads]", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: refetch on any new message in any of my threads
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled || !user) return;

        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        channel = supabase
          .channel(`threads-${user.id}-${suffix}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_messages" },
            () => refresh(),
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_thread_members", filter: `user_id=eq.${user.id}` },
            () => refresh(),
          )
          .subscribe();
      } catch (e) {
        console.error("[useThreads:realtime]", e);
      }
    })();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [refresh]);

  const totalUnread = threads
    .filter((t: any) => !t.archived_at)
    .reduce((sum, t) => sum + (t.unread_count ?? 0), 0);

  return { threads, loading, refresh, totalUnread };
}
