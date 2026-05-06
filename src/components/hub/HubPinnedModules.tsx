import { useNavigate } from "react-router-dom";
import { Zap, BarChart3, Trophy, Video as VideoIcon, Lock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  hasActivePlan: boolean;
  activePlanWeek?: number | null;
  metricsUpdated?: number;
  nextEventName?: string | null;
  matchClipsCount?: number;
  isDemo: boolean;
  isLocked: (mod: "competitions" | "match_analysis") => boolean;
  onAllModules: () => void;
  onTab: (tab: "plan" | "progress") => void;
}

export function HubPinnedModules({
  hasActivePlan,
  activePlanWeek,
  metricsUpdated,
  nextEventName,
  matchClipsCount,
  isDemo,
  isLocked,
  onAllModules,
}: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const tiles = [
    {
      key: "plan",
      icon: Zap,
      title: t("hubTrainingTitle"),
      sub: hasActivePlan && activePlanWeek
        ? `${t("week")} ${activePlanWeek} · ${t("activeBadge")}`
        : hasActivePlan
        ? t("activeBadge")
        : t("hubTrainingDesc").slice(0, 40) + "…",
      iconBg: "bg-tab-plan/15",
      iconColor: "text-tab-plan",
      onClick: () => navigate("/dashboard"),
      locked: false,
    },
    {
      key: "progress",
      icon: BarChart3,
      title: t("hubProgressTitle"),
      sub:
        metricsUpdated && metricsUpdated > 0
          ? `${metricsUpdated} ${t("metricsUpdated")}`
          : t("hubProgressTitle"),
      iconBg: "bg-tab-progress/15",
      iconColor: "text-tab-progress",
      onClick: () => navigate("/dashboard?tab=progress"),
      locked: isDemo,
    },
    {
      key: "competitions",
      icon: Trophy,
      title: t("hubCompetitionsTitle"),
      sub: nextEventName || t("noUpcomingEvent").slice(0, 40),
      iconBg: "bg-explosive/15",
      iconColor: "text-explosive",
      onClick: () => navigate("/competitions"),
      locked: isDemo || isLocked("competitions"),
    },
    {
      key: "match",
      icon: VideoIcon,
      title: t("hubMatchTitle"),
      sub:
        matchClipsCount && matchClipsCount > 0
          ? `${matchClipsCount} ${t("clipsReady")}`
          : t("hubMatchTitle"),
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      onClick: () => navigate("/match-analysis/me"),
      locked: isDemo || isLocked("match_analysis"),
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("pinnedModules")}
        </h3>
        <button
          type="button"
          onClick={onAllModules}
          className="text-xs font-semibold text-destructive hover:underline"
        >
          {t("allModules")} →
        </button>
      </div>
      <div className="grid gap-3 grid-cols-2">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => !tile.locked && tile.onClick()}
              disabled={tile.locked}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-card text-left transition-all ${
                tile.locked
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-primary/30 hover:-translate-y-0.5"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile.iconBg} relative mb-2`}
              >
                <Icon className={`h-4 w-4 ${tile.iconColor}`} />
                {tile.locked && (
                  <Lock className="absolute -right-1 -top-1 h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-bold text-foreground tracking-tight truncate">
                {tile.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{tile.sub}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
