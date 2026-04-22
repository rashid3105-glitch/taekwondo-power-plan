import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getCurrentSubscriptionStatus } from "@/lib/pushNotifications";
import { useLanguage } from "@/i18n/LanguageContext";

interface Prefs {
  training_reminders: boolean;
  diary_comments: boolean;
  event_reminders: boolean;
  competition_countdown: boolean;
  weight_log_reminders: boolean;
  weekly_digest: boolean;
}

const DEFAULTS: Prefs = {
  training_reminders: true, diary_comments: true, event_reminders: true,
  competition_countdown: true, weight_log_reminders: true, weekly_digest: true,
};

export function NotificationSettings() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [supported] = useState(isPushSupported());
  const [enabled, setEnabled] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void init(); }, []);

  async function init() {
    setEnabled(await getCurrentSubscriptionStatus());
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (data) setPrefs({ ...DEFAULTS, ...data } as Prefs);
    }
    setLoading(false);
  }

  async function toggleSubscription() {
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
        toast({ title: t("notifOff") });
      } else {
        const ok = await subscribeToPush();
        setEnabled(ok);
        toast({ title: ok ? t("notifOn") : t("notifPermDenied"), variant: ok ? "default" : "destructive" });
      }
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function updatePref(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("notification_preferences").upsert({ user_id: user.id, ...next });
  }

  if (!supported) {
    return (
      <Card><CardContent className="pt-4 text-sm text-muted-foreground">
        {t("notifUnsupported")}
      </CardContent></Card>
    );
  }
  if (loading) return <Card><CardContent className="pt-4"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          {t("notifPushTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{enabled ? t("notifEnabled") : t("notifDisabled")}</div>
            <div className="text-xs text-muted-foreground">{t("notifDescription")}</div>
          </div>
          <Button size="sm" variant={enabled ? "outline" : "default"} onClick={toggleSubscription} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : enabled ? t("notifTurnOff") : t("notifEnable")}
          </Button>
        </div>
        {enabled && (
          <div className="space-y-3 pt-2 border-t">
            {([
              ["training_reminders", t("notifTraining")],
              ["diary_comments", t("notifDiary")],
              ["event_reminders", t("notifEvents")],
              ["competition_countdown", t("notifCompetition")],
              ["weight_log_reminders", t("notifWeight")],
              ["weekly_digest", t("notifWeeklyDigest")],
            ] as Array<[keyof Prefs, string]>).map(([k, label]) => (
              <div key={k} className="flex items-center justify-between">
                <Label htmlFor={k} className="text-sm">{label}</Label>
                <Switch id={k} checked={prefs[k]} onCheckedChange={(v) => updatePref(k, v)} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
