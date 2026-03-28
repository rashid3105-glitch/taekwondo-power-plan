import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/i18n/LanguageContext";
import { Bell, NotebookPen, Check } from "lucide-react";

interface EventReminder {
  id: string;
  title: string;
  event_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
  coach_id: string;
}

export function EventRemindersDropdown() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [open, setOpen] = useState(false);

  const loadReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("event_reminders" as any)
      .select("*")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setReminders(data as unknown as EventReminder[]);
  };

  useEffect(() => {
    loadReminders();
    // Poll every 60s for new reminders
    const interval = setInterval(loadReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = reminders.filter((r) => !r.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase
      .from("event_reminders" as any)
      .update({ is_read: true })
      .eq("id", id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_read: true } : r))
    );
  };

  const openDiary = (reminder: EventReminder) => {
    markAsRead(reminder.id);
    setOpen(false);
    navigate("/diary");
  };

  if (reminders.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
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
          <h4 className="text-sm font-semibold text-foreground">{t("eventReminders" as any)}</h4>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-border">
          {reminders.map((r) => (
            <div
              key={r.id}
              className={`px-4 py-3 space-y-1 ${r.is_read ? "opacity-60" : "bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">📅 {r.event_date}</p>
                </div>
                {!r.is_read && (
                  <button onClick={() => markAsRead(r.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
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
                {t("writeInDiary" as any)}
              </Button>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
