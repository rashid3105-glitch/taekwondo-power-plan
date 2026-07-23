import { useLocation, useNavigate } from "react-router-dom";
import { Home, Zap, CalendarRange, Heart, Video as VideoIcon, Users, Trophy, ClipboardList } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useCoachMode } from "@/contexts/CoachModeContext";
import { cn } from "@/lib/utils";

// Paths that should NOT show the persistent bottom nav.
// - Public marketing / auth / onboarding
// - /dashboard renders its own nav (kept for legacy tab-switch UX)
// Prefix matches when path === p OR path starts with p + "/".
const HIDDEN_PREFIXES = [
  "/auth", "/login", "/signup", "/invite", "/join", "/parent-join",
  "/reset-password", "/pending-approval", "/onboarding", "/consent",
  "/blog", "/pricing", "/priser", "/privacy", "/terms", "/about", "/contact",
  "/programs", "/platform", "/methodology", "/for-traenere", "/help",
  "/funktioner", "/features", "/poomsae", "/staevneforberedelse-taekwondo",
  "/taekwondo-teknik", "/taekwondo-training-program", "/taekwondo-traeningsprogram",
  "/unsubscribe", "/payment-success", "/mockup", "/athlete", "/match/share",
  "/admin", "/parent-dashboard", "/install", "/kostplan",
];

const EXACT_HIDDEN = new Set(["/", "/dashboard"]);

export function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasCoachRole } = useRole();
  const { isCoachMode } = useCoachMode();

  const path = location.pathname;
  if (EXACT_HIDDEN.has(path)) return null;
  if (HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) return null;

  const coachMode = isCoachMode && hasCoachRole;

  const items = coachMode
    ? [
        { key: "coach-hold", label: t("coachNav") || "Hold", icon: Users, iconClassName: "text-primary", active: path === "/coach", onClick: () => navigate("/coach") },
        { key: "coach-traening", label: t("train") || "Træning", icon: CalendarRange, iconClassName: "text-tab-plan", active: path.startsWith("/coach/season-calendar"), onClick: () => navigate("/coach/season-calendar") },
        { key: "coach-staevner", label: t("competitions") || "Stævner", icon: Trophy, iconClassName: "text-amber-500", active: path.startsWith("/coach/competitions"), onClick: () => navigate("/coach/competitions") },
        { key: "coach-surveys", label: t("surveysTitle") || "Spørgeskemaer", icon: ClipboardList, iconClassName: "text-tab-mental", active: path.startsWith("/coach/surveys"), onClick: () => navigate("/coach/surveys") },
      ]
    : [
        { key: "idag", label: t("today") || "I dag", icon: Home, iconClassName: "text-primary", active: false, onClick: () => navigate("/dashboard?tab=hub") },
        { key: "traen", label: t("train") || "Træn", icon: Zap, iconClassName: "text-tab-plan", active: false, onClick: () => navigate("/dashboard?tab=plan") },
        { key: "kalender", label: t("seasonCalendar") || "Kalender", icon: CalendarRange, iconClassName: "text-tab-progress", active: false, onClick: () => navigate("/dashboard?tab=calendar") },
        { key: "health", label: t("healthNav"), icon: Heart, iconClassName: "text-red-500 fill-red-500", active: path.startsWith("/health"), onClick: () => navigate("/health") },
        { key: "video", label: t("hubMatchTitle") || "Video", icon: VideoIcon, iconClassName: "text-tab-mental", active: path.startsWith("/match-analysis"), onClick: () => navigate("/match-analysis/me") },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      <div className="flex items-stretch justify-around px-1 pt-1.5">
        {items.map(({ key, label, icon: Icon, active, onClick, iconClassName }) => (
          <button
            key={key}
            onClick={() => {
              import("@/lib/haptics").then((h) => h.tap()).catch(() => {});
              onClick();
            }}
            aria-label={label}
            className={cn(
              "relative flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors active:scale-95",
              active ? "text-primary" : "text-muted-foreground"
            )}
            style={{ minHeight: 48 }}
          >
            <Icon className={cn("h-5 w-5", iconClassName)} />
            <span className="text-[9px] font-semibold uppercase tracking-wide leading-tight truncate max-w-full">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
