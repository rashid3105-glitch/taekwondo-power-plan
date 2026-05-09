import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a signed URL for a chat attachment stored in the chat-attachments bucket.
 */
export function useChatAttachmentUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!cancelled) setUrl(error ? null : data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
