import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIAssistant() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareWithCoach, setShareWithCoach] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Draggable position — starts bottom right
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 80 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 160 : 0,
  }));
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (open) return;
    didDrag.current = false;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragOffset.current.x - pos.x;
    const dy = e.clientY - dragOffset.current.y - pos.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 56, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 56, e.clientY - dragOffset.current.y)),
    });
  };

  const onPointerUp = () => { dragging.current = false; };

  const handleClick = () => {
    if (didDrag.current) return;
    setOpen((o) => !o);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant-chat", {
        body: { messages: next },
      });
      if (error) throw error;
      const reply: string =
        (data && (data as any).reply) ||
        (t("aiAssistantError") as string) ||
        "Sorry, something went wrong.";
      const assistantMsg: Message = { role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);

      if (shareWithCoach) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase.from as any)("ai_assistant_logs")
            .insert({
              user_id: user.id,
              question: userMsg.content,
              answer: reply,
              shared_with_coach: true,
            });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (t("aiAssistantError") as string) || "Sorry, something went wrong. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = [
    t("aiSuggest1") as string,
    t("aiSuggest2") as string,
    t("aiSuggest3") as string,
  ];

  return (
    <>
      {/* Floating draggable button */}
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 40,
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
      >
        <button
          className={cn(
            "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-transform select-none",
            "bg-primary text-primary-foreground",
            !open && "hover:scale-110 active:scale-95"
          )}
          aria-label={t("aiAssistantOpen") as string}
        >
          {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>

      {/* Chat dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5 shrink-0">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t("aiAssistantTitle") as string}</p>
                <p className="text-[10px] text-muted-foreground truncate">{t("aiAssistantSubtitle") as string}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("aiAssistantWelcome") as string}
                  </p>
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="w-full text-left text-xs rounded-xl border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors text-muted-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {m.role === "assistant" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mb-1">
                        <Sparkles className="h-3 w-3" /> AI
                      </span>
                    )}
                    <span className="whitespace-pre-wrap block">{m.content}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">{t("aiAssistantThinking") as string}</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Share with coach toggle */}
            <div className="px-4 py-2 border-t border-border flex items-center justify-between gap-2 bg-muted/20 shrink-0">
              <span className="text-[11px] text-muted-foreground">{t("aiShareWithCoach") as string}</span>
              <button
                onClick={() => setShareWithCoach((s) => !s)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                  shareWithCoach ? "bg-primary" : "bg-muted"
                )}
                role="switch"
                aria-checked={shareWithCoach}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    shareWithCoach ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("aiAssistantPlaceholder") as string}
                  rows={1}
                  className="min-h-[44px] max-h-28 resize-none flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={send}
                  disabled={!input.trim() || loading}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
