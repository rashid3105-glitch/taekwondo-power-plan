import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AvatarImg } from "@/components/AvatarImg";
import {
  Menu,
  Home,
  Zap,
  CalendarRange,
  BarChart3,
  Heart,
  Brain,
  BookOpen,
  MessageCircle,
  MessageSquare,
  LayoutGrid,
  User,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  Lock,
  ChevronDown,
  Users,
  Building,
  FileText,
  CreditCard,
  Dumbbell,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { useCoachMode } from "@/contexts/CoachModeContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";

type TabKey =
  | "hub"
  | "plan"
  | "calendar"
  | "progress"
  | "rehab"
  | "mental"
  | "nutrition"
  | "testing";

const NAV_ITEMS: { tab: TabKey; icon: typeof Home; labelKey: string; color: string }[] = [
  { tab: "hub", icon: Home, labelKey: "hubWelcome", color: "text-primary" },
  { tab: "plan", icon: Zap, labelKey: "plan", color: "text-tab-plan" },
  { tab: "calendar", icon: CalendarRange, labelKey: "seasonCalendar", color: "text-primary" },
  { tab: "progress", icon: BarChart3, labelKey: "progress", color: "text-tab-progress" },
  { tab: "rehab", icon: Heart, labelKey: "injuryRehabPlan", color: "text-tab-rehab" },
  { tab: "mental", icon: Brain, labelKey: "mental", color: "text-tab-mental" },
];

// Routes where we do NOT want the global menu (public/auth/marketing).
const HIDDEN_PATHS_EXACT = new Set<string>([
  "/",
  "/v1",
  "/landing",
  "/coach-landing",
  "/auth",
  "/reset-password",
  "/pricing",
  "/priser",
  "/funktioner",
  "/about",
  "/methodology",
  "/contact",
  "/terms",
  "/consent",
  "/unsubscribe",
  "/payment-success",
  "/pending-approval",
  "/parent/join",
  "/privacy-policy",
]);

const HIDDEN_PATH_PREFIXES = [
  "/auth/",
  "/signup",
  "/invite",
  "/join",
  "/platform",
  "/blog",
  "/seo/",
  "/m/",
  "/a/",
  "/share",
  "/reset-password/",
];

function shouldHide(pathname: string): boolean {
  if (HIDDEN_PATHS_EXACT.has(pathname)) return true;
  return HIDDEN_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

interface MiniProfile {
  display_name: string | null;
  avatar_url: string | null;
  belt_level: string | null;
  is_demo: boolean | null;
  payment_status: string | null;
}

export function GlobalAppMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const { hasCoachRole } = useRole();
  const { isCoachMode, setCoachMode } = useCoachMode();
  const { activeMembership } = useActiveClub();

  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MiniProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const isCoach = hasCoachRole;
  const isDemo = !!(profile?.is_demo && profile?.payment_status !== "paid");
  const coachAthleteMode = isCoachMode ? "coach" : "athlete";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthed(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setAuthed(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load mini profile + admin flag when user is known.
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: adminCheck }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url, belt_level, is_demo, payment_status")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.rpc("is_admin", { _user_id: userId }),
      ]);
      if (cancelled) return;
      if (prof) setProfile(prof as MiniProfile);
      if (adminCheck) setIsAdmin(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (authed !== true) return null;
  if (shouldHide(pathname)) return null;

  const isDemoLockedTab = (tab: TabKey) =>
    isDemo && !["hub", "plan"].includes(tab);

  const goTab = (tab: TabKey) => {
    if (isDemoLockedTab(tab)) return;
    setOpen(false);
    // Home should always take the user to the athlete hub, even if they're
    // currently in coach mode (otherwise Dashboard auto-bounces back to /coach).
    if (tab === "hub" && isCoachMode) {
      setCoachMode(false);
    }
    navigate(tab === "hub" ? "/dashboard" : `/dashboard?tab=${tab}`);
  };

  const goAndClose = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  const clubName = activeMembership?.club_name ?? "";

  return (
    <>
      {/* Floating trigger — always top-right, above sticky headers. */}
      <div
        className="fixed right-2 z-[60]"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label={t("menu") || "Menu"}
          className="bg-card/70 backdrop-blur-sm border border-border/60 shadow-sm hover:bg-card"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-72 max-w-[85vw] bg-card border-border p-0 flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="sr-only">{t("menu") || "Menu"}</SheetTitle>
            <div className="flex items-center gap-3">
              <AvatarImg
                avatarUrl={profile?.avatar_url}
                className="h-11 w-11 rounded-full object-cover border-2 border-primary/30 shrink-0"
                fallbackClassName="h-11 w-11 rounded-full bg-muted flex items-center justify-center border-2 border-primary/30 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {profile?.display_name || "Athlete"}
                </p>
                {clubName && (
                  <p className="text-xs text-muted-foreground truncate">{clubName}</p>
                )}
                {profile?.belt_level && (
                  <Badge variant="outline" className="capitalize text-[10px] mt-1">
                    {profile.belt_level}
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          {isCoach && (
            <div className="px-5 pb-3">
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
                <button
                  onClick={() => {
                    setCoachMode(false);
                    setOpen(false);
                    navigate("/dashboard");
                  }}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    !isCoachMode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("athlete") || "Athlete"}
                </button>
                <button
                  onClick={() => {
                    setCoachMode(true);
                    setOpen(false);
                    navigate("/coach");
                  }}
                  className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    isCoachMode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("coach") || "Coach"}
                </button>
              </div>
            </div>
          )}

          <Separator />

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {NAV_ITEMS.map(({ tab, icon: Icon, labelKey, color }) => {
              const locked = isDemoLockedTab(tab);
              return (
                <button
                  key={tab}
                  onClick={() => goTab(tab)}
                  disabled={locked}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground ${
                    locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <span className="truncate">{t(labelKey)}</span>
                  {locked && <Lock className="h-3 w-3 ms-auto shrink-0" />}
                </button>
              );
            })}

            <button
              onClick={() => goAndClose("/library")}
              disabled={isDemo}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground ${
                isDemo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("library")}</span>
              {isDemo && <Lock className="h-3 w-3 ms-auto shrink-0" />}
            </button>

            <Separator className="my-2" />

            <button
              onClick={() => goAndClose("/messages")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>{t("chat") || "Chat"}</span>
            </button>

            {isCoach && (
              <button
                onClick={() => goAndClose("/coach/messages")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>{t("messagesTab") || "Beskeder"}</span>
              </button>
            )}

            {isCoach && (
              <button
                onClick={() => goAndClose("/coach")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span>{t("coachDashboard") || "Coach Dashboard"}</span>
              </button>
            )}

            <button
              onClick={() => goAndClose("/profile-setup")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <User className="h-4 w-4 shrink-0" />
              <span>{t("profile")}</span>
            </button>

            {coachAthleteMode === "coach" && isCoach ? (
              <button
                onClick={() => goAndClose("/hold/moduler")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Administrer moduler</span>
              </button>
            ) : (
              <button
                onClick={() => goAndClose("/moduler")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span>Moduler</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setAdminOpen((v) => !v)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                  aria-expanded={adminOpen}
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{t("admin")}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${adminOpen ? "rotate-180" : ""}`} />
                </button>
                {adminOpen && (
                  <div className="ml-6 mt-1 mb-1 space-y-0.5 border-l border-border pl-2">
                    {[
                      { to: "/admin/approval", icon: Users, label: t("adminUsers") || "Users" },
                      { to: "/admin/drills", icon: Dumbbell, label: t("adminDrills") || "TKD drills" },
                      { to: "/admin/blog", icon: FileText, label: t("adminBlog") || "Blog" },
                      { to: "/admin/clubs", icon: Building, label: t("adminClubs") || "Clubs" },
                      { to: "/admin/payments", icon: CreditCard, label: t("adminPayments") || "Payments" },
                      { to: "/admin/modules", icon: LayoutGrid, label: t("adminModules") || "Modules" },
                    ].map((it) => (
                      <button
                        key={it.to}
                        onClick={() => goAndClose(it.to)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
                      >
                        <it.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{it.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => goAndClose("/help")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>{t("helpTitle")}</span>
            </button>
          </nav>

          <div className="border-t border-border p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t("signOut") || "Sign Out"}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default GlobalAppMenu;
