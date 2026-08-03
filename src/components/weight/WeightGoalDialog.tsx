import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  RATE_PRESETS, assessSafety, daysBetween, inferDirection, rateFromTargetDate, todayISO,
  type WeightGoal,
} from "@/lib/weightPlanner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: WeightGoal | null;
  currentWeight: number | null;
  age?: number | null;
  saving?: boolean;
  onSave: (g: Omit<WeightGoal, "id">) => void;
  onDelete?: () => void;
  onRerunSetup?: () => void;
}

export function WeightGoalDialog({ open, onOpenChange, goal, currentWeight, age, saving, onSave, onDelete, onRerunSetup }: Props) {
  const { t } = useLanguage();
  const [startWeight, setStartWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [rate, setRate] = useState(0.5);

  useEffect(() => {
    if (!open) return;
    setStartWeight(String(goal?.start_weight_kg ?? currentWeight ?? ""));
    setTargetWeight(String(goal?.target_weight_kg ?? ""));
    setTargetDate(goal?.target_date ?? "");
    setRate(Number(goal?.rate_kg_per_week ?? 0.5));
  }, [open, goal, currentWeight]);

  const sw = parseFloat(startWeight);
  const tw = parseFloat(targetWeight);
  const valid = !isNaN(sw) && sw > 20 && !isNaN(tw) && tw > 20;
  const direction = valid ? inferDirection(sw, tw) : "maintain";

  const impliedRate = valid && targetDate
    ? rateFromTargetDate({ start_weight_kg: sw, target_weight_kg: tw, start_date: todayISO(), target_date: targetDate })
    : null;
  const effectiveRate = impliedRate ?? rate;

  const safety = valid
    ? assessSafety({
        currentKg: currentWeight ?? sw,
        targetKg: tw,
        days: targetDate ? Math.max(1, daysBetween(todayISO(), targetDate)) : Math.max(1, Math.round((Math.abs(sw - tw) / (rate || 0.5)) * 7)),
        age,
      })
    : { level: "ok" as const, reasons: [] };

  const reasonText = (r: string) =>
    r === "rateTooFast" ? t("wpSafetyRate")
      : r === "fivePercent" ? t("wpSafetyFive")
      : r === "minorCaution" ? t("wpSafetyMinor")
      : t("wpSafetyWeek");

  const handleSave = () => {
    if (!valid) return;
    onSave({
      start_weight_kg: sw,
      start_date: goal?.start_date ?? todayISO(),
      target_weight_kg: tw,
      target_date: targetDate || null,
      rate_kg_per_week: Math.round((effectiveRate || 0.5) * 100) / 100,
      direction,
      is_active: true,
      activity_level: goal?.activity_level ?? null,
      sex: goal?.sex ?? null,
      motivations: goal?.motivations ?? [],
      challenges: goal?.challenges ?? [],
      onboarded_at: goal?.onboarded_at ?? null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal ? t("wpEditGoal") : t("wpSetGoal")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("wpStartWeight")}</Label>
              <Input type="number" step="0.1" inputMode="decimal" className="h-11" value={startWeight} onChange={(e) => setStartWeight(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("wpTargetWeight")}</Label>
              <Input type="number" step="0.1" inputMode="decimal" className="h-11" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("wpTargetDate")}</Label>
            <Input type="date" className="h-11" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("wpPace")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {RATE_PRESETS.map((p, i) => (
                <Button
                  key={p}
                  type="button"
                  variant={!targetDate && rate === p ? "default" : "outline"}
                  disabled={!!targetDate}
                  className="h-11 flex-col gap-0"
                  onClick={() => setRate(p)}
                >
                  <span className="text-xs font-bold">{p} kg</span>
                  <span className="text-[10px] opacity-70">
                    {i === 0 ? t("wpPaceSlow") : i === 1 ? t("wpPaceModerate") : t("wpPaceFast")}
                  </span>
                </Button>
              ))}
            </div>
            {impliedRate != null && (
              <p className="text-[11px] text-muted-foreground">
                {t("wpPaceFromDate")}: {impliedRate.toFixed(2)} {t("wpKg")}/{t("week").toLowerCase()}
              </p>
            )}
          </div>

          {safety.reasons.length > 0 && (
            <p className={`text-[11px] flex items-start gap-1.5 ${safety.level === "danger" ? "text-destructive" : "text-muted-foreground"}`}>
              <AlertTriangle className="h-3.5 w-3.5 mt-px shrink-0" />
              <span>{reasonText(safety.reasons[0])}</span>
            </p>
          )}

          {onRerunSetup && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-2"
              onClick={() => { onOpenChange(false); onRerunSetup(); }}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4" />
              {t("woRerun")}
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {goal && onDelete && (
            <Button variant="ghost" className="h-11 text-destructive" onClick={onDelete} disabled={saving}>
              {t("wpDeleteGoal")}
            </Button>
          )}
          <Button className="h-11" onClick={handleSave} disabled={!valid || saving}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
