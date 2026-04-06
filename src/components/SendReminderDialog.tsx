import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Bell, Loader2 } from "lucide-react";

interface SendReminderDialogProps {
  athleteId: string;
  athleteName: string;
  athleteEmail?: string;
}

export function SendReminderDialog({ athleteId, athleteName, athleteEmail }: SendReminderDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ title: t("error"), description: t("reminderTitleRequired"), variant: "destructive" });
      return;
    }
    if (!eventDate) {
      toast({ title: t("error"), description: t("reminderDateRequired"), variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get coach name
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      const reminderId = crypto.randomUUID();

      // Insert reminder
      const { error } = await supabase.from("event_reminders" as any).insert({
        id: reminderId,
        coach_id: user.id,
        athlete_id: athleteId,
        title: title.trim(),
        event_date: eventDate,
        message: message.trim(),
      });
      if (error) throw error;

      // Send email if athlete email is known
      if (athleteEmail) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "event-reminder",
            recipientEmail: athleteEmail,
            idempotencyKey: `event-reminder-${reminderId}`,
            templateData: {
              athleteName,
              coachName: coachProfile?.display_name || "Your coach",
              eventTitle: title.trim(),
              eventDate,
              message: message.trim(),
              diaryUrl: "https://taekwondo-power-plan.lovable.app/diary",
            },
          },
        });
      }

      toast({ title: t("reminderSent") });
      setTitle("");
      setEventDate("");
      setMessage("");
      setOpen(false);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title={t("sendReminder")}>
          <Bell className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{t("sendReminder")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("sendReminderTo")} {athleteName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("reminderTitle")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("reminderTitlePlaceholder")}
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("eventDate")}</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("reminderMessage")}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("reminderMessagePlaceholder")}
              rows={3}
              maxLength={500}
            />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bell className="h-4 w-4 mr-1" />}
            {t("sendReminder")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
