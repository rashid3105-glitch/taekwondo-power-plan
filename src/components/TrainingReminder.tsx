import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface TrainingReminderProps {
  planId: string;
  schedule: any[];
}

const STORAGE_KEY = "tkd_training_reminders";

interface ReminderSettings {
  enabled: boolean;
  minutesBefore: number;
}

function getSettings(planId: string): ReminderSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const all = JSON.parse(stored);
      if (all[planId]) return all[planId];
    }
  } catch {}
  return { enabled: false, minutesBefore: 30 };
}

function saveSettings(planId: string, settings: ReminderSettings) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[planId] = settings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function TrainingReminder({ planId, schedule }: TrainingReminderProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<ReminderSettings>(() => getSettings(planId));

  useEffect(() => {
    if (!settings.enabled) return;

    // Schedule notifications for today's training
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[today.getDay()];
    const todaySession = schedule.find((d: any) => d.dayOfWeek === todayName && d.type !== "rest");

    if (!todaySession) return;

    // Set a notification for 9 AM minus the reminder offset
    const sessionTime = new Date(today);
    sessionTime.setHours(9, 0, 0, 0);
    const reminderTime = new Date(sessionTime.getTime() - settings.minutesBefore * 60 * 1000);
    const now = new Date();

    if (reminderTime > now) {
      const timeout = reminderTime.getTime() - now.getTime();
      const timer = setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(`🥋 ${todaySession.label}`, {
            body: `Your training session starts in ${settings.minutesBefore} minutes!`,
            icon: "/favicon.ico",
          });
        }
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [settings, schedule]);

  const toggleReminders = async () => {
    if (!settings.enabled) {
      // Enable
      if (!("Notification" in window)) {
        toast({ title: t("notificationsNotSupported"), variant: "destructive" });
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast({ title: t("notificationPermissionDenied"), variant: "destructive" });
        return;
      }
      const newSettings = { ...settings, enabled: true };
      setSettings(newSettings);
      saveSettings(planId, newSettings);
      toast({ title: t("remindersEnabled") });
    } else {
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      saveSettings(planId, newSettings);
      toast({ title: t("remindersDisabled") });
    }
  };

  const updateMinutes = (value: string) => {
    const newSettings = { ...settings, minutesBefore: parseInt(value) };
    setSettings(newSettings);
    saveSettings(planId, newSettings);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={settings.enabled ? "default" : "outline"}
        size="sm"
        onClick={toggleReminders}
        title={t("trainingReminders")}
      >
        {settings.enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline ml-1">{settings.enabled ? t("trainingReminders") : t("enableReminders")}</span>
      </Button>
      {settings.enabled && (
        <Select value={String(settings.minutesBefore)} onValueChange={updateMinutes}>
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 min</SelectItem>
            <SelectItem value="30">30 min</SelectItem>
            <SelectItem value="60">1 {t("remindersBefore")}</SelectItem>
            <SelectItem value="120">2h {t("remindersBefore")}</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
