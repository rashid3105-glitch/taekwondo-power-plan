// Flushes chat messages composed while offline, in queued order. Idempotent.

import { supabase } from "@/integrations/supabase/client";
import { listChatOutbox, removeChatIntent } from "./chatOfflineDB";

export interface ChatSyncResult {
  flushed: number;
  failed: number;
}

let syncing = false;

export async function syncChat(): Promise<ChatSyncResult> {
  const result: ChatSyncResult = { flushed: 0, failed: 0 };
  if (syncing || !navigator.onLine) return result;
  syncing = true;
  try {
    for (const intent of await listChatOutbox()) {
      try {
        const { error } = await supabase.from("chat_messages").insert({
          thread_id: intent.thread_id,
          sender_id: intent.sender_id,
          body: intent.body,
        } as any);
        if (error) throw error;
        await removeChatIntent(intent.key);
        result.flushed++;

        void supabase.functions.invoke("notify-chat-message", {
          body: { thread_id: intent.thread_id, preview: intent.body.slice(0, 120) },
        }).catch(() => { /* silent */ });
      } catch {
        result.failed++;
      }
    }
  } finally {
    syncing = false;
  }
  return result;
}

/** Starts a listener that flushes the chat outbox whenever connectivity returns. */
export function startChatSyncListener(): () => void {
  const handler = () => { void syncChat(); };
  window.addEventListener("online", handler);
  void syncChat();
  return () => window.removeEventListener("online", handler);
}
