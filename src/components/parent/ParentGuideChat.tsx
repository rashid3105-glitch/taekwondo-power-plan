import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, MessageCircleHeart, Send, User, Sparkles, ExternalLink } from "lucide-react";

interface Props {
  athleteId: string;
  athleteFirstName: string;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS_FALLBACK = [
  "Mit barn er nervøs før stævne — hvordan hjælper jeg bedst?",
  "Hvordan giver jeg feedback efter en dårlig træning?",
  "Hvor meget skal jeg presse, og hvor meget skal jeg støtte?",
  "Hvad siger jeg efter en tabt kamp?",
];

export function ParentGuideChat({ athleteId, athleteFirstName }: Props) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Lazy-load conversation the first time the card is expanded.
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("parent_guide_conversations" as any)
        .select("messages")
        .eq("parent_user_id", user.id)
        .eq("athlete_id", athleteId)
        .maybeSingle();
      const history = Array.isArray((data as any)?.messages) ? (data as any).messages as ChatMsg[] : [];
      setMessages(history);
      setLoaded(true);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }), 50);
    })();
  }, [open, loaded, athleteId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    // Optimistic user bubble
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    try {
      const { data, error } = await supabase.functions.invoke("parent-guide-chat", {
        body: { athleteId, message: msg },
      });
      if (error) throw error;
      if ((data as any)?.error) {
        if ((data as any).error === "daily_limit") {
          toast({ title: t("parentGuideDailyLimit"), variant: "destructive" });
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        throw new Error((data as any).error);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: (data as any).reply }]);
      if (typeof (data as any).remaining === "number") setRemaining((data as any).remaining);
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const suggestions: string[] = (() => {
    const raw = t("parentGuideSuggestions" as any);
    if (typeof raw === "string" && raw.includes("|")) return raw.split("|").map((s) => s.trim()).filter(Boolean);
    return SUGGESTIONS_FALLBACK;
  })();

  return (
    <Card className="p-4 space-y-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          <MessageCircleHeart className="h-4 w-4 text-primary" />
          {t("parentGuideTitle" as any) || "Ask the parent guide"}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 pt-1" dir={language === "ar" ? "rtl" : "ltr"}>
          <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Sparkles className="h-3 w-3 mt-0.5 text-primary shrink-0" />
            <span>
              {t("parentGuideIntro" as any) ||
                "En fortrolig samtalepartner om det at være forælder til en talent-atlet. Kun du kan se samtalen."}
            </span>
          </p>

          {messages.length === 0 && (
            <div className="space-y-1.5">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="w-full text-left text-xs rounded-md border border-border bg-muted/40 hover:bg-muted px-3 py-2 transition-colors disabled:opacity-50"
                >
                  {s.replace("{name}", athleteFirstName)}
                </button>
              ))}
            </div>
          )}

          {messages.length > 0 && (
            <div
              ref={listRef}
              className="max-h-80 overflow-y-auto space-y-2 rounded-md border border-border bg-background/50 p-2"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2 text-sm",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <MessageCircleHeart className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="h-6 w-6 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("parentGuideThinking" as any) || "Tænker…"}
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("parentGuidePlaceholder" as any) || "Skriv dit spørgsmål…"}
              disabled={sending}
              className="flex-1 h-10"
            />
            <Button type="submit" size="sm" disabled={sending || !input.trim()} className="h-10">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t("parentGuideDisclaimer" as any) ||
              "Vejledende samtale — erstatter ikke professionel rådgivning. Ved bekymring om trivsel, kontakt træner, egen læge eller Team Danmark."}
            {" "}
            <a
              href="https://www.teamdanmark.dk/talent/foraeldreguide/gode-raad-til-sportsforaeldre"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5"
            >
              {t("parentGuideSourceLink" as any) || "Baseret på Team Danmarks forældreguide"}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            {remaining !== null && remaining <= 5 && (
              <span className="ml-1 text-amber-600">
                ({remaining} {t("parentGuideRemaining" as any) || "beskeder tilbage i dag"})
              </span>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
