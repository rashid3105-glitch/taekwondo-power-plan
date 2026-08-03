import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame, Pencil, Check, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  dailyCalorieDelta,
  movingAverage,
  progressPercent,
  project,
  weighInStreak,
  todayISO,
  type WeightGoal,
  type WeightPoint,
} from "@/lib/weightPlanner";

interface Props {
  goal: WeightGoal | null;
  logs: WeightPoint[];
  maintenanceKcal: number;
  /** Pre-computed daily intake target (overrides maintenance + goal delta). */
  dailyTargetKcal?: number;
  weighIn: string;
  onWeighInChange: (v: string) => void;
  onWeighInSave: () => void;
  saving?: boolean;
  canEditGoal: boolean;
  onEditGoal: () => void;
  setByCoach?: boolean;
}

function Ring({ pct }: { pct: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 110 110" className="h-28 w-28 -rotate-90">
      <circle cx="55" cy="55" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r} fill="none"
        stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, Math.max(0, pct))) / 100}
        className="transition-all duration-500"
      />
    </svg>
  );
}

export function WeightStatusCard({
  goal, logs, maintenanceKcal, dailyTargetKcal, weighIn, onWeighInChange, onWeighInSave, saving, canEditGoal, onEditGoal, setByCoach,
}: Props) {
  const { t } = useLanguage();

  const ma = useMemo(() => movingAverage(logs), [logs]);
  const currentAvg = ma.length ? ma[ma.length - 1].avg : null;
  const latest = ma.length ? Number(ma[ma.length - 1].weight_kg) : null;
  const streak = useMemo(() => weighInStreak(logs), [logs]);
  const loggedToday = logs.some((l) => l.log_date === todayISO());
  const projection = useMemo(() => (goal ? project(goal, logs) : null), [goal, logs]);

  const pct = goal && currentAvg != null ? progressPercent(goal, currentAvg) : 0;
  const toGo = goal && currentAvg != null ? Math.round((goal.target_weight_kg - currentAvg) * 10) / 10 : null;
  const delta = goal ? dailyCalorieDelta(goal) : 0;
  const dailyTarget = Math.max(1200, maintenanceKcal + delta);

  const DirIcon = goal?.direction === "loss" ? TrendingDown : goal?.direction === "gain" ? TrendingUp : Minus;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Ring pct={pct} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black tabular-nums leading-none">
              {latest != null ? latest.toFixed(1) : "–"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{t("wpKg")}</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {goal ? (
            <>
              <p className="text-sm font-bold">
                {t("wpGoal")} <span className="text-primary tabular-nums">{Number(goal.target_weight_kg).toFixed(1)}</span> {t("wpKg")}
              </p>
              {toGo != null && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {Math.abs(toGo).toFixed(1)} {t("wpKg")} {t("wpToGo")} · {pct}%
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 tabular-nums">
                <DirIcon className="h-3 w-3 text-primary" />
                {goal.rate_kg_per_week} {t("wpKg")}/{t("week").toLowerCase()}
                {projection?.trendKgPerWeek != null && (
                  <span className="opacity-70">
                    · {t("wpTrend")} {projection.trendKgPerWeek > 0 ? "+" : ""}{projection.trendKgPerWeek.toFixed(2)}
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t("wpNoGoalDesc")}</p>
          )}
          {canEditGoal && (
            <button onClick={onEditGoal} className="text-xs text-primary font-semibold flex items-center gap-1">
              <Pencil className="h-3 w-3" />
              {goal ? t("wpEditGoal") : t("wpSetGoal")}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weighIn}
          onChange={(e) => onWeighInChange(e.target.value)}
          placeholder={t("wpWeighInPlaceholder")}
          className="h-11"
        />
        <Button onClick={onWeighInSave} disabled={saving || !weighIn} className="h-11 shrink-0">
          {t("wpLogWeight")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
        <span className="font-semibold text-foreground">
          {dailyTarget} {t("wpKcal")}
        </span>
        <span>{delta === 0 ? t("wpMaintain") : `${delta < 0 ? t("wpDeficit") : t("wpSurplus")} ${Math.abs(delta)}`}</span>
        {goal && projection?.etaDate && (
          <span>· {t("wpEta")} {new Date(projection.etaDate).toLocaleDateString()}</span>
        )}
        {loggedToday && <span className="flex items-center gap-0.5 text-primary"><Check className="h-3 w-3" />{t("wpLoggedToday")}</span>}
        {streak > 1 && <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-primary" />{streak}</span>}
        {setByCoach && <span>· {t("wpSetByCoach")}</span>}
      </div>
    </Card>
  );
}
