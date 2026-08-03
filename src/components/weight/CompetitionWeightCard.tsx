import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { assessSafety, daysBetween, movingAverage, todayISO, type WeightPoint } from "@/lib/weightPlanner";

interface Competition {
  id: string;
  name: string;
  event_date: string;
  weight_class_kg: number | null;
}

interface Props {
  competition: Competition | null;
  logs: WeightPoint[];
  age?: number | null;
}

export function CompetitionWeightCard({ competition, logs, age }: Props) {
  const { t } = useLanguage();

  const ma = useMemo(() => movingAverage(logs), [logs]);
  const current = ma.length ? ma[ma.length - 1].avg : null;

  if (!competition || !competition.weight_class_kg || current == null) return null;

  const days = Math.max(0, daysBetween(todayISO(), competition.event_date));
  const toCut = Math.round((current - competition.weight_class_kg) * 10) / 10;
  const safety = assessSafety({ currentKg: current, targetKg: competition.weight_class_kg, days: days || 1, age });

  const tone =
    toCut <= 0 ? "ok" : safety.level;
  const toneClass =
    tone === "ok" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-destructive";
  const toneLabel =
    tone === "ok" ? t("wpSafe") : tone === "warn" ? t("wpTight") : t("wpUnsafe");

  const reasonText = (r: string) =>
    r === "rateTooFast" ? t("wpSafetyRate")
      : r === "fivePercent" ? t("wpSafetyFive")
      : r === "minorCaution" ? t("wpSafetyMinor")
      : t("wpSafetyWeek");

  const warn = toCut > 0 && safety.reasons.length > 0;

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-bold truncate">{competition.name}</p>
        <Badge variant="outline" className={`ml-auto text-[10px] shrink-0 ${toneClass}`}>{toneLabel}</Badge>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {days} {t("wpDaysLeft").toLowerCase()} · {t("wpWeightClass")} {competition.weight_class_kg} {t("wpKg")} ·{" "}
        <span className={toneClass}>{toCut > 0 ? `${toCut.toFixed(1)} ${t("wpKg")}` : "0"} {t("wpKgToClass").toLowerCase()}</span>
      </p>
      <p className="text-[11px] flex items-start gap-1.5 text-muted-foreground">
        {warn ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-px shrink-0" />
            <span>{reasonText(safety.reasons[0])}</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 mt-px shrink-0" />
            <span>{t("wpSafeCut")}</span>
          </>
        )}
      </p>
    </Card>
  );
}
