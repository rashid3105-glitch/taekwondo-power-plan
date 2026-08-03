import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertTriangle, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { ChoiceList, MultiList, NumberStep, StepShell } from "./steps";
import {
  ACTIVITY_LEVELS, RATE_PRESETS, assessSafety, daysBetween, todayISO,
  type ActivityLevel, type WeightGoal,
} from "@/lib/weightPlanner";

interface Props {
  currentWeight: number | null;
  age?: number | null;
  saving?: boolean;
  onCancel?: () => void;
  onComplete: (g: Omit<WeightGoal, "id">) => void | Promise<void>;
}

type Focus = "loss" | "gain" | "maintain";

const MOTIVATIONS = ["performance", "recovery", "weightClass", "energy", "noDiets", "routines"];
const CHALLENGES = ["routines", "planning", "temptations", "portions", "inspiration", "aroundTraining"];

export function WeightOnboarding({ currentWeight, age, saving, onCancel, onComplete }: Props) {
  const { t } = useLanguage();

  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [sex, setSex] = useState<"female" | "male" | null>(null);
  const [ageInput, setAgeInput] = useState(age ? String(age) : "");
  const [weightInput, setWeightInput] = useState(currentWeight != null ? String(currentWeight) : "");
  const [targetInput, setTargetInput] = useState("");
  const [rate, setRate] = useState(0.5);
  const [targetDate, setTargetDate] = useState("");
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [motivations, setMotivations] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const steps: Array<"focus" | "sex" | "age" | "weight" | "target" | "pace" | "activity" | "motivation" | "challenge" | "building"> =
    useMemo(() => {
      const base: any[] = ["focus", "sex", "age", "weight"];
      if (focus && focus !== "maintain") base.push("target", "pace");
      base.push("activity", "motivation", "challenge", "building");
      return base;
    }, [focus]);

  const key = steps[Math.min(step, steps.length - 1)];
  const total = steps.length;

  const sw = parseFloat(weightInput.replace(",", "."));
  const tw = focus === "maintain" ? sw : parseFloat(targetInput.replace(",", "."));
  const parsedAge = parseInt(ageInput, 10);

  const safety = useMemo(() => {
    if (isNaN(sw) || isNaN(tw)) return { level: "ok" as const, reasons: [] as string[] };
    const days = targetDate
      ? Math.max(1, daysBetween(todayISO(), targetDate))
      : Math.max(1, Math.round((Math.abs(sw - tw) / (rate || 0.5)) * 7));
    return assessSafety({ currentKg: sw, targetKg: tw, days, age: isNaN(parsedAge) ? age : parsedAge });
  }, [sw, tw, targetDate, rate, parsedAge, age]);

  const reasonText = (r: string) =>
    r === "rateTooFast" ? t("wpSafetyRate")
      : r === "fivePercent" ? t("wpSafetyFive")
        : r === "minorCaution" ? t("wpSafetyMinor")
          : t("wpSafetyWeek");

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Building animation, then save.
  useEffect(() => {
    if (key !== "building") return;
    setProgress(0);
    const id = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 90);
    return () => clearInterval(id);
  }, [key]);

  useEffect(() => {
    if (key !== "building" || progress < 100) return;
    void onComplete({
      start_weight_kg: sw,
      start_date: todayISO(),
      target_weight_kg: focus === "maintain" ? sw : tw,
      target_date: targetDate || null,
      rate_kg_per_week: focus === "maintain" ? 0 : Math.round((rate || 0.5) * 100) / 100,
      direction: (focus ?? "maintain") as WeightGoal["direction"],
      is_active: true,
      activity_level: activity,
      sex,
      motivations,
      challenges,
      onboarded_at: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, progress]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const buildRows = [t("woBuild1"), t("woBuild2"), t("woBuild3"), t("woBuild4")];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        {step > 0 && key !== "building" ? (
          <button type="button" onClick={back} className="text-muted-foreground hover:text-foreground shrink-0" aria-label={t("woBack")}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : onCancel ? (
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground shrink-0" aria-label={t("woBack")}>
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((Math.min(step, total - 1) + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {key === "focus" && (
        <StepShell title={t("woStepFocus")} help={t("woChangeLater")}>
          <ChoiceList
            value={focus}
            onSelect={(v) => { setFocus(v as Focus); next(); }}
            options={[
              { value: "loss", label: t("woFocusLoss") },
              { value: "gain", label: t("woFocusGain") },
              { value: "maintain", label: t("woFocusMaintain") },
            ]}
          />
        </StepShell>
      )}

      {key === "sex" && (
        <StepShell title={t("woStepSex")} help={t("woSexHelp")}>
          <ChoiceList
            columns={2}
            value={sex}
            onSelect={(v) => { setSex(v as "female" | "male"); next(); }}
            options={[
              { value: "female", label: t("woSexFemale") },
              { value: "male", label: t("woSexMale") },
            ]}
          />
        </StepShell>
      )}

      {key === "age" && (
        <StepShell title={t("woStepAge")} help={t("woAgeHelp")}>
          <NumberStep
            value={ageInput}
            onChange={setAgeInput}
            onContinue={next}
            disabled={isNaN(parsedAge) || parsedAge < 5 || parsedAge > 100}
          />
        </StepShell>
      )}

      {key === "weight" && (
        <StepShell title={t("woStepCurrent")} help={t("woCurrentHelp")}>
          <NumberStep
            value={weightInput}
            onChange={setWeightInput}
            suffix={t("wpKg")}
            step="0.1"
            onContinue={next}
            disabled={isNaN(sw) || sw < 20 || sw > 250}
          />
        </StepShell>
      )}

      {key === "target" && (
        <StepShell title={t("woStepTarget")} help={t("woTargetHelp")}>
          <NumberStep
            value={targetInput}
            onChange={setTargetInput}
            suffix={t("wpKg")}
            step="0.1"
            onContinue={next}
            disabled={isNaN(tw) || tw < 20 || tw > 250}
          />
        </StepShell>
      )}

      {key === "pace" && (
        <StepShell title={t("woStepPace")} help={t("woPaceHelp")}>
          <div className="grid grid-cols-3 gap-2">
            {RATE_PRESETS.map((p, i) => (
              <Button
                key={p}
                type="button"
                variant={!targetDate && rate === p ? "default" : "outline"}
                disabled={!!targetDate}
                className="h-14 flex-col gap-0"
                onClick={() => setRate(p)}
              >
                <span className="text-sm font-bold">{p} {t("wpKg")}</span>
                <span className="text-[10px] opacity-70">
                  {i === 0 ? t("wpPaceSlow") : i === 1 ? t("wpPaceModerate") : t("wpPaceFast")}
                </span>
              </Button>
            ))}
          </div>
          <div className="space-y-1.5 pt-1">
            <p className="text-xs text-muted-foreground">{t("woOrTargetDate")}</p>
            <Input type="date" className="h-12" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          {safety.reasons.length > 0 && (
            <p className={cn("text-[11px] flex items-start gap-1.5", safety.level === "danger" ? "text-destructive" : "text-muted-foreground")}>
              <AlertTriangle className="h-3.5 w-3.5 mt-px shrink-0" />
              <span>{reasonText(safety.reasons[0])}</span>
            </p>
          )}
          <Button className="w-full h-12 font-bold mt-2" onClick={next}>{t("woContinue")}</Button>
        </StepShell>
      )}

      {key === "activity" && (
        <StepShell title={t("woStepActivity")} help={t("woActivityHelp")}>
          <ChoiceList
            value={activity}
            onSelect={(v) => { setActivity(v as ActivityLevel); next(); }}
            options={ACTIVITY_LEVELS.map((lvl) => ({
              value: lvl,
              label: t(`woAct_${lvl}` as any),
            }))}
          />
        </StepShell>
      )}

      {key === "motivation" && (
        <StepShell
          title={t("woStepMotivation")}
          help={t("woMultiHint")}
          footer={<Button className="w-full h-12 font-bold" onClick={next}>{t("woContinue")}</Button>}
        >
          <MultiList
            values={motivations}
            onToggle={(v) => toggle(motivations, setMotivations, v)}
            options={MOTIVATIONS.map((m) => ({ value: m, label: t(`woMot_${m}` as any) }))}
          />
        </StepShell>
      )}

      {key === "challenge" && (
        <StepShell
          title={t("woStepChallenge")}
          help={t("woMultiHint")}
          footer={<Button className="w-full h-12 font-bold" onClick={next}>{t("woContinue")}</Button>}
        >
          <MultiList
            values={challenges}
            onToggle={(v) => toggle(challenges, setChallenges, v)}
            options={CHALLENGES.map((c) => ({ value: c, label: t(`woCha_${c}` as any) }))}
          />
        </StepShell>
      )}

      {key === "building" && (
        <div className="space-y-5 animate-fade-in">
          <h2 className="text-xl font-black tracking-tight text-center">{t("woBuildingTitle")}</h2>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            {buildRows.map((label, i) => {
              const rowPct = Math.max(0, Math.min(100, (progress - i * 25) * 4));
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {rowPct >= 100
                      ? <Check className="h-4 w-4 text-primary shrink-0" />
                      : <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />}
                    <span className="text-sm font-semibold flex-1">{label}</span>
                    <span className="text-sm font-bold tabular-nums text-muted-foreground">{Math.round(rowPct)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-200" style={{ width: `${rowPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {saving && <p className="text-xs text-muted-foreground text-center">{t("woSavingPlan")}</p>}
        </div>
      )}
    </div>
  );
}

export default WeightOnboarding;
