import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  goalKcal: number;
  intakeKcal: number;
  burnedKcal: number;
}

export function CalorieRing({ goalKcal, intakeKcal, burnedKcal }: Props) {
  const { t } = useLanguage();
  const budget = Math.max(1, goalKcal + burnedKcal);
  const remaining = Math.round(budget - intakeKcal);
  const pct = Math.min(100, Math.max(0, (intakeKcal / budget) * 100));
  const over = remaining < 0;

  const r = 62;
  const c = 2 * Math.PI * r;
  // 3/4 circle gauge
  const arc = c * 0.75;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-center min-w-[64px]">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("wpdIntake")}</p>
        <p className="text-xl font-black tabular-nums">{Math.round(intakeKcal)}</p>
      </div>

      <div className="relative shrink-0">
        <svg viewBox="0 0 150 150" className="h-36 w-36 rotate-[135deg]">
          <circle
            cx="75" cy="75" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${arc} ${c}`}
          />
          <circle
            cx="75" cy="75" r={r} fill="none"
            stroke={over ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(arc * pct) / 100} ${c}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="text-[11px] text-muted-foreground leading-tight">
            {over ? t("wpdOver") : t("wpdRemaining")}
          </span>
          <span className={`text-3xl font-black tabular-nums leading-none ${over ? "text-destructive" : ""}`}>
            {Math.abs(remaining)}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 tabular-nums">
            {t("wpdGoalKcal")} {Math.round(goalKcal)} {t("wpKcal")}
          </span>
        </div>
      </div>

      <div className="text-center min-w-[64px]">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("wpdBurned")}</p>
        <p className="text-xl font-black tabular-nums">{Math.round(burnedKcal)}</p>
      </div>
    </div>
  );
}
