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
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      channel = supabase
        .channel(`threads-${user.id}`)
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
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  const totalUnread = threads
    .filter((t: any) => !t.archived_at)
    .reduce((sum, t) => sum + (t.unread_count ?? 0), 0);

  return { threads, loading, refresh, totalUnread };
}
