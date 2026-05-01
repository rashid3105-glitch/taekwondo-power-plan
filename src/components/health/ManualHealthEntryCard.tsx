import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Moon, HeartPulse, Waves, Footprints, Save } from "lucide-react";
import { toast } from "sonner";
import { tap } from "@/lib/haptics";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  onSaved?: () => void;
}

/**
 * Manual entry form for daily recovery/activity numbers.
 * Writes to public.wearable_daily_summary (existing table) so all charts,
 * recovery tiles and coach views keep working unchanged.
 */
export function ManualHealthEntryCard({ onSaved }: Props) {
  const { t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const [sleep, setSleep] = useState("");
  const [rhr, setRhr] = useState("");
  const [hrv, setHrv] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);

  // Prefill if a row already exists for the chosen date.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wearable_daily_summary")
        .select("sleep_minutes,resting_hr,hrv_rmssd,steps")
        .eq("user_id", user.id)
        .eq("summary_date", date)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setSleep(data.sleep_minutes != null ? String(Math.round((data.sleep_minutes / 60) * 10) / 10) : "");
        setRhr(data.resting_hr != null ? String(Math.round(Number(data.resting_hr))) : "");
        setHrv(data.hrv_rmssd != null ? String(Math.round(Number(data.hrv_rmssd))) : "");
        setSteps(data.steps != null ? String(data.steps) : "");
      } else {
        setSleep(""); setRhr(""); setHrv(""); setSteps("");
      }
    })();
    return () => { cancelled = true; };
  }, [date]);

  const parse = (v: string): number | null => {
    const s = v.trim().replace(",", ".");
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  async function handleSave() {
    tap();
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(t("authRequired")); return; }

      const sleepHours = parse(sleep);
      const rhrVal = parse(rhr);
      const hrvVal = parse(hrv);
      const stepsVal = parse(steps);

      if (sleepHours == null && rhrVal == null && hrvVal == null && stepsVal == null) {
        toast.error(t("manualNoValues"));
        return;
      }

      // Compute fresh 7-day baselines (RHR / HRV) including this new entry.
      const since = new Date(new Date(date).getTime() - 7 * 86400_000).toISOString().slice(0, 10);
      const { data: recent } = await supabase
        .from("wearable_daily_summary")
        .select("summary_date,resting_hr,hrv_rmssd")
        .eq("user_id", user.id)
        .gte("summary_date", since)
        .lte("summary_date", date);

      const rhrPool = (recent ?? [])
        .filter(r => r.summary_date !== date && r.resting_hr != null)
        .map(r => Number(r.resting_hr));
      if (rhrVal != null) rhrPool.push(rhrVal);
      const hrvPool = (recent ?? [])
        .filter(r => r.summary_date !== date && r.hrv_rmssd != null)
        .map(r => Number(r.hrv_rmssd));
      if (hrvVal != null) hrvPool.push(hrvVal);

      const baseHr = rhrPool.length ? rhrPool.reduce((a, b) => a + b, 0) / rhrPool.length : null;
      const baseHrv = hrvPool.length ? hrvPool.reduce((a, b) => a + b, 0) / hrvPool.length : null;

      const { error } = await supabase
        .from("wearable_daily_summary")
        .upsert({
          user_id: user.id,
          summary_date: date,
          sleep_minutes: sleepHours != null ? Math.round(sleepHours * 60) : null,
          resting_hr: rhrVal,
          hrv_rmssd: hrvVal,
          steps: stepsVal != null ? Math.round(stepsVal) : null,
          baseline_hr_7d: baseHr,
          baseline_hrv_7d: baseHrv,
          computed_at: new Date().toISOString(),
        }, { onConflict: "user_id,summary_date" });

      if (error) throw error;
      toast.success(t("manualSavedToast"));
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || t("manualSaveError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-4 border-2 border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Save className="h-4 w-4 text-primary" />
          {t("manualHealthTitle")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t("manualHealthHint")}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="health-date" className="text-xs">{t("date")}</Label>
          <Input
            id="health-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            id="m-sleep"
            label={t("manualSleepLabel")}
            placeholder="7.5"
            unit="h"
            icon={<Moon className="h-3.5 w-3.5" />}
            value={sleep}
            onChange={setSleep}
            inputMode="decimal"
          />
          <Field
            id="m-rhr"
            label={t("manualRhrLabel")}
            placeholder="54"
            unit="bpm"
            icon={<HeartPulse className="h-3.5 w-3.5" />}
            value={rhr}
            onChange={setRhr}
            inputMode="numeric"
          />
          <Field
            id="m-hrv"
            label={t("manualHrvLabel")}
            placeholder="62"
            unit="ms"
            icon={<Waves className="h-3.5 w-3.5" />}
            value={hrv}
            onChange={setHrv}
            inputMode="numeric"
          />
          <Field
            id="m-steps"
            label={t("manualStepsLabel")}
            placeholder="8420"
            unit=""
            icon={<Footprints className="h-3.5 w-3.5" />}
            value={steps}
            onChange={setSteps}
            inputMode="numeric"
          />
        </div>

        <Button onClick={handleSave} disabled={busy} className="w-full">
          <Save className="h-4 w-4 mr-1.5" />
          {busy ? "…" : (t("manualSaveBtn"))}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  id, label, placeholder, unit, icon, value, onChange, inputMode,
}: {
  id: string;
  label: string;
  placeholder: string;
  unit: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  inputMode: "decimal" | "numeric";
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs flex items-center gap-1.5">
        {icon}{label}
      </Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={unit ? "pr-10" : ""}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
