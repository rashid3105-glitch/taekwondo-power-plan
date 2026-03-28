import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Trash2, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Reminder {
  id: string;
  title: string;
  event_date: string;
  message: string;
  is_read: boolean;
  created_at: string;
  athlete_id: string;
}

interface ReminderHistoryProps {
  athleteId: string;
}

export function ReminderHistory({ athleteId }: ReminderHistoryProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expanded, setExpanded] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("event_reminders" as any)
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setReminders(data as unknown as Reminder[]);
  };

  useEffect(() => {
    load();
  }, [athleteId]);

  const handleDelete = async (id: string) => {
    await supabase.from("event_reminders" as any).delete().eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast({ title: t("delete") });
  };

  if (reminders.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4" /> {t("reminderHistory" as any)} ({reminders.length})
        </h4>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border p-3 space-y-1 ${r.is_read ? "border-border bg-secondary/30" : "border-primary/30 bg-primary/5"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">📅 {r.event_date}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${r.is_read ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    {r.is_read ? t("reminderRead" as any) : t("reminderUnread" as any)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              {r.message && <p className="text-xs text-muted-foreground">{r.message}</p>}
              <p className="text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
