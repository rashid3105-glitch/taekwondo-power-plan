import { AlertTriangle, Heart, ClipboardX, Activity } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export type PulseFilter = "all" | "attention" | "injured" | "noPlan" | "stale";

interface PulseStats {
  total: number;
  attention: number;
  injured: number;
  noPlan: number;
  stale: number;
}

interface Props {
  stats: PulseStats;
  active: PulseFilter;
  onChange: (filter: PulseFilter) => void;
  headerAction?: React.ReactNode;
}

export function SquadPulse({ stats, active, onChange, headerAction }: Props) {
  const { t } = useLanguage();

  const tiles: {
    key: PulseFilter;
    label: string;
    value: number;
    icon: any;
    tone: string;
    activeTone: string;
  }[] = [
    {
      key: "attention",
      label: t("pulseAttention"),
      value: stats.attention,
      icon: AlertTriangle,
      tone: "border-border bg-card text-foreground",
      activeTone: "border-destructive/60 bg-destructive/10 text-destructive",
    },
    {
      key: "injured",
      label: t("pulseInjured"),
      value: stats.injured,
      icon: Heart,
      tone: "border-border bg-card text-foreground",
      activeTone: "border-destructive/60 bg-destructive/10 text-destructive",
    },
    {
      key: "noPlan",
      label: t("pulseNoPlan"),
      value: stats.noPlan,
      icon: ClipboardX,
      tone: "border-border bg-card text-foreground",
      activeTone: "border-orange-400/60 bg-orange-400/10 text-orange-500",
    },
    {
      key: "stale",
      label: t("pulseStale"),
      value: stats.stale,
      icon: Activity,
      tone: "border-border bg-card text-foreground",
      activeTone: "border-amber-400/60 bg-amber-400/10 text-amber-500",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("squadPulseTitle")}
        </h3>
        <div className="flex items-center gap-2">
          {active !== "all" && (
            <button
              type="button"
              onClick={() => onChange("all")}
              className="text-xs text-primary hover:underline"
            >
              {t("clearFilter")}
            </button>
          )}
          {headerAction}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const isActive = active === tile.key;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => onChange(isActive ? "all" : tile.key)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors hover:bg-accent/30",
                isActive ? tile.activeTone : tile.tone,
              )}
              aria-pressed={isActive}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                <Icon className="h-3 w-3 opacity-70 flex-shrink-0" />
                <span className="truncate">{tile.label}</span>
              </p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums">{tile.value}</p>
            </button>
          );
        })}
      </div>

    </div>
  );
}
