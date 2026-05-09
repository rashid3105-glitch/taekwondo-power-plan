import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listMessages, markThreadRead, type ChatMessage } from "@/lib/chatApi";

export function useMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    try {
      const data = await listMessages(threadId);
      setMessages(data);
      await markThreadRead(threadId).catch(() => {});
    } catch (e) {
      console.error("[useMessages]", e);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    setMessages([]);
    if (threadId) refresh();
  }, [threadId, refresh]);

  // Realtime per-thread INSERTs
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          markThreadRead(threadId).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  return { messages, loading, refresh, setMessages };
}
