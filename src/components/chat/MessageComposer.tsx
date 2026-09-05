import { useState, useRef } from "react";
import { Send, Image, X, Mic, MicOff, Smile } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendMessage, MAX_ATTACHMENT_BYTES, type ChatMessage } from "@/lib/chatApi";
import { compressImageFile } from "@/lib/imageCompression";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  threadId: string;
  onSent?: (message: ChatMessage) => void;
}

export function MessageComposer({ threadId, onSent }: Props) {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const EMOJIS = ["👍", "❤️", "🔥", "💪", "🥋", "🎯", "👏", "😄", "🙏", "✅"];

  const limitLabel = `${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)} MB`;

  const handleFile = async (f: File | null) => {
    if (!f) return setFile(null);
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      toast.error(t("composerOnlyMedia"));
      return;
    }
    // Images are compressed client-side so they fit the shared attachment limit.
    let next = f;
    if (f.type.startsWith("image/") && f.size > MAX_ATTACHMENT_BYTES) {
      setProcessing(true);
      const toastId = toast.loading(t("composerCompressing"));
      try {
        next = await compressImageFile(f, MAX_ATTACHMENT_BYTES);
      } finally {
        toast.dismiss(toastId);
        setProcessing(false);
      }
      if (next.size <= MAX_ATTACHMENT_BYTES && next !== f) {
        toast.success(t("composerCompressed").replace("{size}", `${(next.size / 1024).toFixed(0)} KB`));
      }
    }
    if (next.size > MAX_ATTACHMENT_BYTES) {
      toast.error(t("composerFileTooLarge").replace("{size}", limitLabel));
      return;
    }
    setFile(next);
  };

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(t("composerVoiceUnsupported"));
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "da-DK";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setBody((prev) => (prev ? prev + " " + transcript : transcript).trim());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const send = async () => {
    if (!body.trim() && !file) return;
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    }
    setShowEmoji(false);
    setSending(true);
    try {
      const sent = await sendMessage({ threadId, body, file });
      setBody("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onSent?.(sent);
    } catch (e: any) {
      toast.error(e?.message || t("composerSendFailed"));
    } finally {
      setSending(false);
    }
  };

  const canSend = Boolean(body.trim() || file);

  return (
    <div className="relative border-t border-border/60 bg-card/95 backdrop-blur px-3 pt-2 pb-nav-safe">
      {file && (
        <div className="flex items-center gap-2 mb-2 text-xs bg-muted rounded-md px-2 py-1">
          <Image className="h-3 w-3" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground" aria-label={t("cancel")}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-full left-3 mb-2 z-20 flex flex-wrap gap-1 p-2 bg-card border border-border rounded-xl shadow-lg max-w-[260px]">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                setBody((b) => b + e);
                setShowEmoji(false);
              }}
              className="h-9 w-9 text-lg hover:bg-muted rounded"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Simple bar: plain icons + one rounded input pill */}
      <div className="flex items-end gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => { void handleFile(e.target.files?.[0] ?? null); }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full text-gold hover:bg-gold/10"
          onClick={() => fileRef.current?.click()}
          aria-label={t("iconHintAttachImage")} title={t("iconHintAttachImage")}
        >
          <Image className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 rounded-full transition-colors",
            recording ? "text-destructive animate-pulse bg-destructive/10" : "text-gold hover:bg-gold/10"
          )}
          onClick={toggleRecording}
          aria-label={recording ? t("iconHintStopRecording") : t("iconHintVoiceRecord")}
          title={recording ? t("iconHintStopRecording") : t("iconHintVoiceRecord")}
        >
          {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <div className="flex flex-1 items-end gap-1 rounded-full bg-muted/60 pl-3 pr-1 py-0.5 focus-within:bg-muted transition-colors">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={recording ? t("composerRecording") : t("composerPlaceholder")}
            rows={1}
            maxLength={2000}
            className="min-h-[36px] max-h-28 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-base leading-snug shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 self-end mb-1 rounded-full text-gold hover:bg-gold/10"
            onClick={() => setShowEmoji((s) => !s)}
            aria-label={t("iconHintEmoji")} title={t("iconHintEmoji")}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {(canSend || sending) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full text-gold hover:bg-gold/10 active:scale-95 transition-transform disabled:opacity-40"
            onClick={send}
            disabled={sending || processing || !canSend}
            aria-label={t("iconHintSend")} title={t("iconHintSend")}
          >
            {sending ? (
              <span className="h-4 w-4 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

