import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageContext";
import { Bell, NotebookPen, Check, MessageSquare } from "lucide-react";

interface EventReminder {
  id: string;
  title: string;
  event_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
  coach_id: string;
}

interface CoachMessage {
  id: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  coach_id: string;
}

export function EventRemindersDropdown() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [open, setOpen] = useState(false);
  const mountedRef = useRef(true);

  const loadInbox = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: rData }, { data: mData }] = await Promise.all([
      supabase
        .from("event_reminders" as any)
        .select("*")
        .eq("athlete_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("coach_messages" as any)
        .select("*")
        .eq("athlete_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (!mountedRef.current) return;
    if (rData) setReminders(rData as unknown as EventReminder[]);
    if (mData) setMessages(mData as unknown as CoachMessage[]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadInbox();
    const interval = window.setInterval(() => {
      void loadInbox();
    }, 60000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [loadInbox]);

  const unreadCount =
    reminders.filter((r) => !r.is_read).length +
    messages.filter((m) => !m.is_read).length;

  const markReminderRead = async (id: string) => {
    await supabase.rpc("mark_reminder_read", { _reminder_id: id });
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_read: true } : r))
    );
  };

  const markMessageRead = async (id: string) => {
    await supabase.rpc("mark_coach_message_read" as any, { _message_id: id });
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );
  };

  const openDiary = (reminder: EventReminder) => {
    markReminderRead(reminder.id);
    setOpen(false);
    navigate("/diary");
  };

  if (reminders.length === 0 && messages.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("iconHintNotifications")} title={t("iconHintNotifications")}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">{t("inbox")}</h4>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-border">
          {messages.map((m) => (
            <div
              key={`msg-${m.id}`}
              className={`px-4 py-3 space-y-1 ${m.is_read ? "opacity-60" : "bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    {m.subject}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!m.is_read && (
                  <button
                    onClick={() => markMessageRead(m.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {m.body && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {m.body}
                </p>
              )}
            </div>
          ))}
          {reminders.map((r) => (
            <div
              key={`rem-${r.id}`}
              className={`px-4 py-3 space-y-1 ${r.is_read ? "opacity-60" : "bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">📅 {r.event_date}</p>
                </div>
                {!r.is_read && (
                  <button onClick={() => markReminderRead(r.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {r.message && (
                <p className="text-xs text-muted-foreground line-clamp-2">{r.message}</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => openDiary(r)}
              >
                <NotebookPen className="h-3 w-3 mr-1" />
                {t("writeInDiary")}
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
