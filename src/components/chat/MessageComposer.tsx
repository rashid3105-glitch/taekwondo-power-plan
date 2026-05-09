import { useState, useRef } from "react";
import { Send, Paperclip, X, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendMessage, MAX_ATTACHMENT_BYTES } from "@/lib/chatApi";

const EMOJIS = ["👍", "❤️", "🔥", "💪", "🥋", "🎯", "👏", "😄", "🙏", "✅"];

interface Props {
  threadId: string;
  onSent?: () => void;
}

export function MessageComposer({ threadId, onSent }: Props) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (f.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Filen er for stor. Maks 1 MB.");
      return;
    }
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      toast.error("Kun billeder eller video tilladt");
      return;
    }
    setFile(f);
  };

  const send = async () => {
    if (!body.trim() && !file) return;
    setSending(true);
    try {
      await sendMessage({ threadId, body, file });
      setBody("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onSent?.();
    } catch (e: any) {
      toast.error(e?.message || "Kunne ikke sende");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-card p-2 pb-safe">
      {file && (
        <div className="flex items-center gap-2 mb-2 text-xs bg-muted rounded-md px-2 py-1">
          <Paperclip className="h-3 w-3" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {showEmoji && (
        <div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted rounded-md">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                setBody((b) => b + e);
                setShowEmoji(false);
              }}
              className="h-9 w-9 text-lg hover:bg-background rounded"
            >
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileRef.current?.click()}
          aria-label="Vedhæft"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowEmoji((s) => !s)}
          aria-label="Emoji"
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Skriv en besked…"
          rows={1}
          maxLength={2000}
          className="min-h-[44px] max-h-32 flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          onClick={send}
          disabled={sending || (!body.trim() && !file)}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
