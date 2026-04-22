import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, MessageSquare, Trash2, Loader2, Inbox, CheckCircle2, Circle } from "lucide-react";

interface SentMessage {
  id: string;
  athlete_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface SentReminder {
  id: string;
  athlete_id: string;
  title: string;
  message: string;
  event_date: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  coachId: string;
  /** Map of athlete_id -> display name, used to label rows. */
  athleteNames: Record<string, string>;
}

export function CoachSentHistory({ coachId, athleteNames }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [reminders, setReminders] = useState<SentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const [msgRes, remRes] = await Promise.all([
      supabase
        .from("coach_messages")
        .select("id, athlete_id, subject, body, is_read, created_at")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("event_reminders")
        .select("id, athlete_id, title, message, event_date, is_read, created_at")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (!msgRes.error && msgRes.data) setMessages(msgRes.data as SentMessage[]);
    if (!remRes.error && remRes.data) setReminders(remRes.data as SentReminder[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId]);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(language, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  const deleteMessage = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("coach_messages").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast({ title: t("deleted") });
  };

  const deleteReminder = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("event_reminders").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: t("deleted") });
  };

  const ReadBadge = ({ read }: { read: boolean }) => (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
        read ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
      }`}
    >
      {read ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
      {read ? t("reminderRead") : t("reminderUnread")}
    </span>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" /> {t("sentHistoryTitle")}
        </h4>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : t("refresh")}
        </Button>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="messages" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" /> {t("sentMessagesTab")} ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs">
            <Bell className="h-3 w-3 mr-1" /> {t("sentRemindersTab")} ({reminders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-3">
          {loading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{t("noSentMessages")}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-border bg-background/50 p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.subject}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("toLabel")} {athleteNames[m.athlete_id] || t("noName")} · {fmtDate(m.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ReadBadge read={m.is_read} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteMessage(m.id)}
                        disabled={deletingId === m.id}
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {m.body && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                      {m.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="mt-3">
          {loading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : reminders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{t("noSentReminders")}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-border bg-background/50 p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("toLabel")} {athleteNames[r.athlete_id] || t("noName")} · 📅 {r.event_date} · {fmtDate(r.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ReadBadge read={r.is_read} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteReminder(r.id)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {r.message && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                      {r.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
