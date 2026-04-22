import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  user_id: string;
  display_name: string;
}

interface Props {
  selected: Athlete[];
  onClear: () => void;
}

export function BulkActionsBar({ selected, onClear }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (selected.length === 0) return null;

  const sendBulkReminder = async () => {
    if (!title.trim() || !eventDate) {
      toast({ title: t("error"), description: t("reminderTitleRequired"), variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const rows = selected.map((a) => ({
        coach_id: user.id,
        athlete_id: a.user_id,
        title: title.trim(),
        event_date: eventDate,
        message: message.trim(),
      }));
      const { error } = await supabase.from("event_reminders").insert(rows);
      if (error) throw error;
      toast({ title: t("reminderSent"), description: `${selected.length} ${t("athletes")}` });
      setReminderOpen(false);
      setTitle(""); setEventDate(""); setMessage("");
      onClear();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="sticky bottom-2 z-20 mx-auto max-w-2xl rounded-xl border border-primary/40 bg-card shadow-lg p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground">
          {selected.length} {t("selected")}
        </span>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setReminderOpen(true)}>
          <Bell className="h-3 w-3 mr-1" /> {t("remind")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> {t("bulkSendReminder")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("sendingTo")} {selected.length} {t("athletes")}
            </p>
            <div className="space-y-1">
              <Label className="text-xs">{t("reminderTitleLabel")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("eventDateLabel")}</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("reminderMessageLabel")}</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={1000} />
            </div>
            <Button onClick={sendBulkReminder} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("send")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
