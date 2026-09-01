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

return (
    <div className="border-t border-border/60 bg-card/95 backdrop-blur px-3 pt-2.5 pb-nav-safe">
      {file && (
        <div className="flex items-center gap-2 mb-2 text-xs bg-muted rounded-md px-2 py-1">
          <Image className="h-3 w-3" />
          <span className="truncate flex-1">{file.name}</span>
          <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {/* Unified rounded composer bar */}
      <div className="flex items-end gap-1 rounded-2xl bg-card border border-border/70 shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-1.5 focus-within:border-gold/60 transition-colors">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => { void handleFile(e.target.files?.[0] ?? null); }}
        />
        {/* Image attach */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10"
          onClick={() => fileRef.current?.click()}
          aria-label={t("iconHintAttachImage")} title={t("iconHintAttachImage")}
        >
          <Image className="h-5 w-5" />
        </Button>
        {/* Mic — voice to text */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg transition-colors",
            recording
              ? "text-destructive animate-pulse bg-destructive/10"
              : "text-muted-foreground hover:text-gold hover:bg-gold/10"
          )}
          onClick={toggleRecording}
          aria-label={recording ? t("iconHintStopRecording") : t("iconHintVoiceRecord")} title={recording ? t("iconHintStopRecording") : t("iconHintVoiceRecord")}
        >
          {recording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        {/* Emoji picker toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10"
          onClick={() => setShowEmoji((s) => !s)}
          aria-label={t("iconHintEmoji")} title={t("iconHintEmoji")}
        >
          <Smile className="h-5 w-5" />
        </Button>
        {showEmoji && (
          <div className="absolute bottom-20 left-2 z-20 flex flex-wrap gap-1 p-2 bg-card border border-border rounded-xl shadow-lg max-w-[260px]">
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
        {/* Text input */}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={recording ? t("composerRecording") : t("composerPlaceholder")}
          rows={1}
          maxLength={2000}
          className="min-h-[38px] max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-base leading-snug shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        {/* Send — gold */}
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gold text-gold-dark shadow-[0_2px_10px_rgba(212,175,55,0.35)] hover:bg-gold-light transition-transform active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:hover:bg-gold"
          onClick={send}
          disabled={sending || processing || (!body.trim() && !file)}
          aria-label={t("iconHintSend")} title={t("iconHintSend")}
        >
          {sending ? (
            <span className="h-4 w-4 rounded-full border-2 border-gold-dark/30 border-t-gold-dark animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

