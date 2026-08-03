import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { WeightGoal } from "@/lib/weightPlanner";

interface Props {
  goal: WeightGoal | null;
  currentWeight: number | null;
  onAdd: () => void;
}

export function WeightProgressBar({ goal, currentWeight, onAdd }: Props) {
  const { t } = useLanguage();
  const start = goal ? Number(goal.start_weight_kg) : currentWeight;
  const target = goal ? Number(goal.target_weight_kg) : null;
  let pct = 0;
  if (start != null && target != null && currentWeight != null) {
    const total = target - start;
    pct = Math.abs(total) < 0.01 ? 100 : Math.max(0, Math.min(100, ((currentWeight - start) / total) * 100));
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">{t("wpdUpdateWeight")}</p>
          <p className="text-xs text-muted-foreground">{t("wpdUpdateWeightSub")}</p>
        </div>
        <button
          onClick={onAdd}
          aria-label={t("wpdUpdateWeight")}
          title={t("wpdUpdateWeight")}
          className="h-9 w-9 shrink-0 rounded-full border border-primary/40 text-primary flex items-center justify-center"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{currentWeight != null ? `${currentWeight.toFixed(1)} ${t("wpKg")}` : "–"}</span>
        <span>{target != null ? `${target.toFixed(1)} ${t("wpKg")}` : "–"}</span>
      </div>
    </div>
  );
}
