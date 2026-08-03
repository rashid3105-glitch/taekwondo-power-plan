import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Flame, Pencil, Scale, TrendingDown, TrendingUp, Minus, Trophy } from "lucide-react";
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
  weighIn: string;
  onWeighInChange: (v: string) => void;
  onWeighInSave: () => void;
  saving?: boolean;
  canEditGoal: boolean;
  onEditGoal: () => void;
  setByCoach?: boolean;
}

export function WeightStatusCard({
  goal, logs, maintenanceKcal, weighIn, onWeighInChange, onWeighInSave, saving, canEditGoal, onEditGoal, setByCoach,
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
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("wpCurrent")}</p>
            <p className="text-4xl font-black tabular-nums">
              {latest != null ? latest.toFixed(1) : "–"}
              <span className="text-base font-bold text-muted-foreground ml-1">{t("wpKg")}</span>
            </p>
            {currentAvg != null && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("wpMovingAvg")}: {currentAvg.toFixed(1)} {t("wpKg")}
              </p>
            )}
          </div>
          {goal && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("wpGoal")}</p>
              <p className="text-2xl font-black tabular-nums text-primary">
                {Number(goal.target_weight_kg).toFixed(1)}
              </p>
              {toGo != null && (
                <p className="text-[11px] text-muted-foreground">
                  {Math.abs(toGo).toFixed(1)} {t("wpKg")} {t("wpToGo")}
                </p>
              )}
            </div>
          )}
        </div>

        {goal && (
          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{pct}% · {t("wpProgress")}</span>
              <span className="flex items-center gap-1">
                <DirIcon className="h-3 w-3 text-primary" />
                {goal.rate_kg_per_week} {t("wpKg")}/{t("week").toLowerCase()}
              </span>
            </div>
          </div>
        )}

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
            <Scale className="h-4 w-4 mr-1.5" />
            {t("wpLogWeight")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loggedToday && <Badge variant="secondary" className="text-[10px]">{t("wpLoggedToday")}</Badge>}
          {streak > 1 && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Flame className="h-3 w-3 text-primary" /> {streak} {t("wpStreak")}
            </Badge>
          )}
          {setByCoach && <Badge variant="outline" className="text-[10px]">{t("wpSetByCoach")}</Badge>}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("wpDailyTarget")}</p>
          <p className="text-2xl font-black tabular-nums">{dailyTarget}</p>
          <p className="text-[11px] text-muted-foreground">
            {delta === 0 ? t("wpMaintain") : `${delta < 0 ? t("wpDeficit") : t("wpSurplus")}: ${Math.abs(delta)} ${t("wpKcal")}`}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{t("wpTrend")}</p>
          <p className="text-2xl font-black tabular-nums">
            {projection?.trendKgPerWeek != null ? `${projection.trendKgPerWeek > 0 ? "+" : ""}${projection.trendKgPerWeek.toFixed(2)}` : "–"}
          </p>
          <p className="text-[11px] text-muted-foreground">{t("wpTrendPerWeek")}</p>
        </Card>
      </div>

      {goal && projection && (
        <Card className="p-4 flex items-start gap-3">
          <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">
              {projection.etaDate
                ? `${t("wpEta")}: ${new Date(projection.etaDate).toLocaleDateString()}`
                : t("wpEtaNone")}
            </p>
            {projection.aheadDays != null && (
              <p className="text-muted-foreground mt-0.5">
                {projection.aheadDays >= 0
                  ? `${projection.aheadDays} ${t("wpAhead")}`
                  : `${Math.abs(projection.aheadDays)} ${t("wpBehind")}`}
              </p>
            )}
          </div>
        </Card>
      )}

      {canEditGoal && (
        <Button variant="outline" className="w-full h-11" onClick={onEditGoal}>
          <Pencil className="h-4 w-4 mr-2 text-primary" />
          {goal ? t("wpEditGoal") : t("wpSetGoal")}
        </Button>
      )}
    </div>
  );
}
