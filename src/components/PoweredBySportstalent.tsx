import { useLocation } from "react-router-dom";
import runnerIcon from "@/assets/runner-icon.png";
import { useClubBranding } from "@/components/ClubThemeProvider";
import { useLanguage } from "@/i18n/LanguageContext";

// Same prefixes as AppBottomNav, but /dashboard is treated as an app-shell route.
const HIDDEN_PREFIXES = [
  "/auth", "/login", "/signup", "/invite", "/join", "/parent-join",
  "/reset-password", "/pending-approval", "/onboarding", "/consent",
  "/blog", "/pricing", "/priser", "/privacy", "/terms", "/about", "/contact",
  "/programs", "/platform", "/methodology", "/for-traenere",
  "/funktioner", "/features", "/poomsae", "/staevneforberedelse",
  "/tekniktraening", "/traeningsprogram", "/fysiske-test",
  "/unsubscribe", "/payment-success", "/mockup", "/athlete", "/match/share",
  "/admin", "/parent-dashboard", "/install", "/kostplan", "/messages",
];

const EXACT_HIDDEN = new Set(["/"]);

function shouldShowMark(pathname: string): boolean {
  if (EXACT_HIDDEN.has(pathname)) return false;
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function PoweredBySportstalent() {
  const { enabled } = useClubBranding();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  if (!enabled || !shouldShowMark(pathname)) return null;

  return (
    <>
      {/* Mobile: tiny icon just above the bottom nav */}
      <div
        className="fixed left-2 z-10 flex sm:hidden items-center justify-center rounded-md bg-card/80 backdrop-blur-sm border border-border/40 px-1.5 py-1"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)" }}
        aria-label="Sportstalent"
      >
        <img
          src={runnerIcon}
          alt=""
          className="h-4 w-auto opacity-80"
          style={{ display: "block" }}
        />
      </div>

      {/* Desktop: subtle 'powered by' mark at the bottom-left */}
      <div className="fixed left-3 z-10 hidden sm:flex items-center gap-2 rounded-md bg-card/80 backdrop-blur-sm border border-border/40 px-2 py-1.5 bottom-3">
        <img
          src={runnerIcon}
          alt=""
          className="h-4 w-auto opacity-80"
          style={{ display: "block" }}
        />
        <span className="text-[11px] font-semibold text-foreground/70 tracking-tight whitespace-nowrap">
          {t("poweredBy") || "Powered by Sportstalent"}
        </span>
      </div>
    </>
  );
}
