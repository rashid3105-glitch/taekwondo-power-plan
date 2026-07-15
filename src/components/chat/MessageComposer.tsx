import { useState, useRef } from "react";
import { Send, Image, X, Mic, MicOff, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendMessage, MAX_ATTACHMENT_BYTES } from "@/lib/chatApi";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  threadId: string;
  onSent?: () => void;
}

export function MessageComposer({ threadId, onSent }: Props) {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const EMOJIS = ["👍", "❤️", "🔥", "💪", "🥋", "🎯", "👏", "😄", "🙏", "✅"];

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

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Stemmeoptager understøttes ikke i denne browser");
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
    <div className="border-t border-border bg-card p-2 pb-safe relative">
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
      <div className="flex items-end gap-1.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {/* Image attach */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0"
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
            "h-9 w-9 flex-shrink-0 transition-colors",
            recording
              ? "text-destructive animate-pulse"
              : "text-muted-foreground hover:text-foreground"
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
          className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0"
          onClick={() => setShowEmoji((s) => !s)}
          aria-label={t("iconHintEmoji")} title={t("iconHintEmoji")}
        >
          <Smile className="h-5 w-5" />
        </Button>
        {showEmoji && (
          <div className="absolute bottom-16 left-2 z-20 flex flex-wrap gap-1 p-2 bg-card border border-border rounded-lg shadow-lg max-w-[260px]">
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
          placeholder={recording ? "Optager…" : "Skriv en besked…"}
          rows={1}
          maxLength={2000}
          className="min-h-[44px] max-h-32 flex-1 resize-none text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        {/* Send */}
        <Button
          type="button"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={send}
          disabled={sending || (!body.trim() && !file)}
          aria-label={t("iconHintSend")} title={t("iconHintSend")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
