import { useLanguage } from "@/i18n/LanguageContext";
import type { MacroTargets } from "@/lib/weightPlanner";

interface Props {
  targets: MacroTargets;
  intake: { protein_g: number; carbs_g: number; fat_g: number };
}

function Bar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="flex-1 rounded-xl border border-border/60 bg-card/60 p-2.5 space-y-1.5">
      <p className="text-[11px] font-semibold truncate">{label}</p>
      <p className="text-xs text-muted-foreground tabular-nums">{Math.round(value)}/{target} g</p>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MacroBars({ targets, intake }: Props) {
  const { t } = useLanguage();
  return (
    <div className="flex gap-2">
      <Bar label={t("wpdCarbs")} value={intake.carbs_g} target={targets.carbs_g} />
      <Bar label={t("wpdProtein")} value={intake.protein_g} target={targets.protein_g} />
      <Bar label={t("wpdFat")} value={intake.fat_g} target={targets.fat_g} />
    </div>
  );
}
