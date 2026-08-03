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

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold">{t("wpCompetition")}</p>
        <Badge variant="outline" className={`ml-auto text-[10px] ${toneClass}`}>{toneLabel}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-muted-foreground">{t("wpDaysLeft")}</p>
          <p className="text-xl font-black tabular-nums">{days}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{t("wpWeightClass")}</p>
          <p className="text-xl font-black tabular-nums">{competition.weight_class_kg}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{t("wpKgToClass")}</p>
          <p className={`text-xl font-black tabular-nums ${toneClass}`}>{toCut > 0 ? toCut.toFixed(1) : "0"}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground truncate">{competition.name}</p>
      {toCut > 0 && safety.reasons.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-[11px] text-foreground space-y-1">
            {safety.reasons.map((r) => <p key={r}>{reasonText(r)}</p>)}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-foreground">{t("wpSafeCut")}</p>
        </div>
      )}
    </Card>
  );
}
