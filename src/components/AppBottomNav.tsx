import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, Zap, CalendarRange, Heart, Video as VideoIcon, Users, Trophy,
  MessageCircle, User as UserIcon, BookOpen, HelpCircle, Repeat,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useCoachMode } from "@/contexts/CoachModeContext";
import { useMatchAnalysisEnabled } from "@/hooks/useMatchAnalysisEnabled";
import { useThreads } from "@/hooks/useThreads";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Paths that should NOT show the persistent bottom nav.
// Public marketing / auth / onboarding only — every signed-in surface keeps
// the bar, including chat.
const HIDDEN_PREFIXES = [
  "/auth", "/login", "/signup", "/invite", "/join", "/parent-join",
  "/reset-password", "/pending-approval", "/onboarding", "/consent",
  "/blog", "/pricing", "/priser", "/privacy", "/terms", "/about", "/contact",
  "/programs", "/platform", "/methodology", "/for-traenere",
  "/funktioner", "/features", "/poomsae", "/staevneforberedelse",
  "/tekniktraening", "/traeningsprogram", "/fysiske-test",
  "/unsubscribe", "/payment-success", "/mockup", "/athlete", "/match/share",
  "/admin", "/parent-dashboard", "/install", "/kostplan",
];


const EXACT_HIDDEN = new Set(["/"]);

export function AppBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasCoachRole, loading: roleLoading } = useRole();
  const { isCoachMode, isCoachRoute } = useCoachMode();
  const { matchAnalysisEnabled } = useMatchAnalysisEnabled();
  const { totalUnread } = useThreads();
  const [meOpen, setMeOpen] = useState(false);

  const path = location.pathname;
  const hidden =
    EXACT_HIDDEN.has(path) ||
    HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  // Lets sticky bottom bars (chat composer etc.) reserve space via .pb-nav-safe.
  useEffect(() => {
    if (hidden) {
      document.body.classList.remove("has-bottom-nav");
      return;
    }
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, [hidden]);

  if (hidden) return null;
  // Avoid flashing the athlete nav before the role/club state has resolved.
  if (roleLoading) return null;

  const coachMode = (isCoachMode || isCoachRoute) && hasCoachRole;

  // Route-based active state — the dashboard keeps its tab in ?tab=
  const onDashboard = path === "/dashboard";
  const dashboardTab = onDashboard
    ? new URLSearchParams(location.search).get("tab") || "hub"
    : null;

  const chatItem = {
    key: "chat",
    label: t("navChat"),
    icon: MessageCircle,
    iconClassName: "text-primary",
    active: path.startsWith("/messages"),
    badge: totalUnread,
    onClick: () => navigate("/messages"),
  };
  const meItem = {
    key: "me",
    label: t("navMe"),
    icon: UserIcon,
    iconClassName: "text-muted-foreground",
    active: meOpen,
    badge: 0,
    onClick: () => setMeOpen(true),
  };

  const items = coachMode
    ? [
        { key: "coach-idag", label: t("todayTab") || "I dag", icon: Home, iconClassName: "text-primary", active: path.startsWith("/coach/today"), badge: 0, onClick: () => navigate("/coach/today") },
        { key: "coach-hold", label: t("coachNav") || "Hold", icon: Users, iconClassName: "text-tab-plan", active: path === "/coach", badge: 0, onClick: () => navigate("/coach") },
        { key: "coach-staevner", label: t("competitionsTitle") || "Stævner", icon: Trophy, iconClassName: "text-amber-500", active: path.startsWith("/coach/competitions"), badge: 0, onClick: () => navigate("/coach/competitions") },
        chatItem,
        meItem,
      ]
    : [
        { key: "idag", label: t("today") || "I dag", icon: Home, iconClassName: "text-primary", active: dashboardTab === "hub", badge: 0, onClick: () => navigate("/dashboard?tab=hub") },
        { key: "traen", label: t("train") || "Træn", icon: Zap, iconClassName: "text-tab-plan", active: dashboardTab === "plan", badge: 0, onClick: () => navigate("/dashboard?tab=plan") },
        { key: "kalender", label: t("seasonCalendar") || "Kalender", icon: CalendarRange, iconClassName: "text-tab-progress", active: dashboardTab === "calendar", badge: 0, onClick: () => navigate("/dashboard?tab=calendar") },
        chatItem,
        meItem,
      ];

  const meLinks = [
    ...(coachMode
      ? []
      : [
          { key: "health", label: t("healthNav"), icon: Heart, to: "/health" },
          ...(matchAnalysisEnabled
            ? [{ key: "video", label: t("hubMatchTitle") || "Video", icon: VideoIcon, to: "/match-analysis/me" }]
            : []),
          { key: "library", label: t("libraryTitle") || "Bibliotek", icon: BookOpen, to: "/library" },
        ]),
    { key: "profile", label: t("profile") || "Profil", icon: UserIcon, to: "/profile" },
    ...(hasCoachRole
      ? [{ key: "switch", label: coachMode ? (t("today") || "Atlet") : (t("coachNav") || "Træner"), icon: Repeat, to: coachMode ? "/dashboard?tab=hub" : "/coach" }]
      : []),
    { key: "help", label: t("helpTitle") || "Hjælp", icon: HelpCircle, to: "/help" },
  ];

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm pb-safe",
          // On the dashboard the desktop layout has its own top tab bar
          onDashboard && "sm:hidden"
        )}
      >
        <div className="flex items-stretch justify-around px-1 pt-1.5">
          {items.map(({ key, label, icon: Icon, active, onClick, iconClassName, badge }) => (
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
              <span className="relative">
                <Icon className={cn("h-5 w-5", iconClassName)} />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wide leading-tight truncate max-w-full">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Sheet open={meOpen} onOpenChange={setMeOpen}>
        <SheetContent side="bottom" className="pb-safe">
          <SheetHeader>
            <SheetTitle>{t("navMe")}</SheetTitle>
          </SheetHeader>
          <ul className="mt-3 space-y-1">
            {meLinks.map(({ key, label, icon: Icon, to }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => { setMeOpen(false); navigate(to); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-muted transition-colors"
                  style={{ minHeight: 48 }}
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
