import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Apple, Heart, ClipboardList, CalendarRange, BookOpen, Lock, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  isDemo: boolean;
  isLocked: (mod: "rehab" | "testing" | "library" | "season_plan") => boolean;
  onTab: (tab: "mental" | "nutrition" | "rehab" | "testing") => void;
}

const SEEN_KEY = "hub_module_seen_v1";

function getSeen(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}"); } catch { return {}; }
}

export function HubOtherModules({ isDemo, isLocked, onTab }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [seen, setSeen] = useState<Record<string, boolean>>(getSeen);

  const markSeen = (key: string) => {
    const next = { ...seen, [key]: true };
    setSeen(next);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const chips = [
    { key: "mental", icon: Brain, label: t("mental"), color: "text-tab-mental", bg: "bg-tab-mental/10 border-tab-mental/30", onClick: () => onTab("mental"), locked: isDemo, hasNew: false },
    { key: "nutrition", icon: Apple, label: t("nutrition"), color: "text-tab-nutrition", bg: "bg-tab-nutrition/10 border-tab-nutrition/30", onClick: () => onTab("nutrition"), locked: isDemo, hasNew: false },
    { key: "rehab", icon: Heart, label: t("hubRehabTitle"), color: "text-tab-rehab", bg: "bg-tab-rehab/10 border-tab-rehab/30", onClick: () => onTab("rehab"), locked: isDemo || isLocked("rehab"), hasNew: true },
    { key: "testing", icon: ClipboardList, label: t("testing"), color: "text-primary", bg: "bg-primary/10 border-primary/30", onClick: () => onTab("testing"), locked: isDemo || isLocked("testing"), hasNew: false },
    { key: "season", icon: CalendarRange, label: t("hubSeasonTitle"), color: "text-primary", bg: "bg-primary/10 border-primary/30", onClick: () => navigate("/season"), locked: isDemo || isLocked("season_plan"), hasNew: false },
    { key: "library", icon: BookOpen, label: t("hubLibraryTitle"), color: "text-primary", bg: "bg-primary/10 border-primary/30", onClick: () => navigate("/library"), locked: isDemo || isLocked("library"), hasNew: false },
  ];

  return (
    <section id="hub-other-modules">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
        {t("otherModules")}
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
        {chips.map((chip) => {
          const Icon = chip.icon;
          const showDot = chip.hasNew && !chip.locked && !seen[chip.key];
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                if (chip.locked) return;
                markSeen(chip.key);
                chip.onClick();
              }}
              disabled={chip.locked}
              className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${chip.bg} ${chip.color} ${chip.locked ? "opacity-60" : "hover:opacity-90"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {chip.label}
              {chip.locked && <Lock className="h-3 w-3 ml-0.5" />}
              {showDot && (
                <span
                  aria-label="new"
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
