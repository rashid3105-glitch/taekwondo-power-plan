import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sun, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Checkin {
  id: string;
  score: number;
  recommendation: "green" | "amber" | "red";
  checkin_date: string;
}

export function ReadinessCard() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [today, setToday] = useState<Checkin | null>(null);
  const [open, setOpen] = useState(false);
  const [sleep, setSleep] = useState([7.5]);
  const [soreness, setSoreness] = useState([2]);
  const [mood, setMood] = useState([4]);
  const [motivation, setMotivation] = useState([4]);
  const [sick, setSick] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const TIER = {
    green: { label: t("readinessTierGreen"), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
    amber: { label: t("readinessTierAmber"), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
    red: { label: t("readinessTierRed"), icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" },
  } as const;

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from("readiness_checkins").select("*").eq("user_id", user.id).eq("checkin_date", todayStr).maybeSingle();
    if (data) setToday(data as any);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-readiness", {
        body: { sleep_hours: sleep[0], soreness: soreness[0], mood: mood[0], motivation: motivation[0], is_sick: sick },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setToday(data as Checkin);
      setOpen(false);
      toast({ title: t("readinessLogged"), description: `${t("readinessScoreLabel")} ${(data as any).score}/100` });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  if (today) {
    const tier = TIER[today.recommendation];
    const Icon = tier.icon;
    return (
      <Card className={`border-2 ${tier.bg}`}>
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Icon className={`h-6 w-6 ${tier.color} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">{t("readinessScoreLabel")} {today.score}/100</div>
            <div className={`text-xs ${tier.color}`}>{tier.label}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card className="border-2 border-primary/40 bg-primary/5">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Sun className="h-6 w-6 text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold">{t("readinessMorningTitle")}</div>
            <div className="text-xs text-muted-foreground">{t("readinessMorningDesc")}</div>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>{t("readinessStart")}</Button>
        </CardContent>
      </Card>
    );
  }

  const sorenessWord = soreness[0] <= 2 ? t("readinessFresh") : soreness[0] >= 4 ? t("readinessVerySore") : t("readinessOk");

  return (
    <Card className="border-2 border-primary/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("readinessHowFeel")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">{t("readinessSleep")}: <strong>{sleep[0]} {t("readinessHours")}</strong></Label>
          <Slider value={sleep} onValueChange={setSleep} min={0} max={12} step={0.5} />
        </div>
        <div>
          <Label className="text-xs">{t("readinessSoreness")}: <strong>{soreness[0]}/5</strong> ({sorenessWord})</Label>
          <Slider value={soreness} onValueChange={setSoreness} min={1} max={5} step={1} />
        </div>
        <div>
          <Label className="text-xs">{t("readinessMood")}: <strong>{mood[0]}/5</strong></Label>
          <Slider value={mood} onValueChange={setMood} min={1} max={5} step={1} />
        </div>
        <div>
          <Label className="text-xs">{t("readinessMotivation")}: <strong>{motivation[0]}/5</strong></Label>
          <Slider value={motivation} onValueChange={setMotivation} min={1} max={5} step={1} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sick" className="text-xs">{t("readinessSick")}</Label>
          <Switch id="sick" checked={sick} onCheckedChange={setSick} />
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">{t("cancel")}</Button>
          <Button size="sm" onClick={submit} disabled={submitting} className="flex-1">{submitting ? t("readinessSaving") : t("readinessSubmit")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
