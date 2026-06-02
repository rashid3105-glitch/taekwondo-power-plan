import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, User, BookOpen, Plus, LogOut, Loader2, BarChart3, Heart, Shield, Users, Brain, Clock, Apple, Home, Lock, NotebookPen, AlertTriangle, ClipboardList, HelpCircle, Trash2, Menu, Video as VideoIcon, CalendarRange, Watch, Swords, Trophy, MessageCircle, Pencil, X, LayoutGrid, Settings, Camera } from "lucide-react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EventRemindersDropdown } from "@/components/EventRemindersDropdown";
// MessagesIcon removed: chat is now a global floating button
import { AvatarImg } from "@/components/AvatarImg";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import { AIPlanCard } from "@/components/AIPlanCard";
import { Badge } from "@/components/ui/badge";
import { RehabPlanCard } from "@/components/RehabPlanCard";
import { MedicalDocumentTranslator } from "@/components/MedicalDocumentTranslator";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCoachMode } from "@/contexts/CoachModeContext";
import { useRole } from "@/contexts/RoleContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Help from "@/pages/Help";
import { MentalAssessment } from "@/components/MentalAssessment";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { NutritionPlan } from "@/components/NutritionPlan";
import { NutritionLibrary } from "@/components/NutritionLibrary";
import { FoodScanner } from "@/components/FoodScanner";
import { Card } from "@/components/ui/card";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PhysicalTesting } from "@/components/PhysicalTesting";
import { Separator } from "@/components/ui/separator";
import { SplashScreen } from "@/components/SplashScreen";
// ReadinessCard moved into HubReadinessBanner (conditional + dismissible).
import { RecoveryTile } from "@/components/RecoveryTile";
import { ReflectionPromptCard } from "@/components/ReflectionPromptCard";
import { EnablePasskeyCard } from "@/components/EnablePasskeyCard";
import { Calendar as CalendarIcon, Sparkles, ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEntitlements, useAthleteModuleAccess } from "@/hooks/useEntitlements";
import type { LockedModule } from "@/lib/entitlements";
import { FeatureEmptyState } from "@/components/FeatureEmptyState";
import { TodayCard } from "@/components/today/TodayCard";
import { HubTodayHero } from "@/components/hub/HubTodayHero";
// HubDailyQuote removed from dashboard.
import { HubNextEvent } from "@/components/hub/HubNextEvent";
import { HubRecoveryStrip } from "@/components/hub/HubRecoveryStrip";
import { SeasonCalendarView } from "@/components/hub/SeasonCalendarView";

import { HubOtherModules } from "@/components/hub/HubOtherModules";
import { HubReadinessBanner } from "@/components/hub/HubReadinessBanner";
import { InviteWelcomeBanner } from "@/components/hub/InviteWelcomeBanner";
import { AthleteDashboard } from "@/components/hub/AthleteDashboard";
import { CoachDashboard } from "@/components/hub/CoachDashboard";

import { useOfflineProfile } from "@/hooks/useOfflineProfile";
import { useOfflinePlan } from "@/hooks/useOfflinePlan";

// Feature flag — sæt til true for at genaktivere de gamle hub-sektioner
// (Restitution-strip, Fastgjorte moduler, Øvrige moduler chips)
const SHOW_LEGACY_HUB_SECTIONS = false;


interface Profile {
  display_name: string;
  age: number | null;
  weight_kg: number | null;
  belt_level: string;
  goals: string[];
  tkd_sessions_per_week: number;
  experience_years: number | null;
  avatar_url: string | null;
  program_weeks: number | null;
  weekly_schedule: any;
  current_injury: string | null;
  athlete_code: string | null;
  discipline: string;
  club_id: string | null;
}

interface TrainingPlan {
  id: string;
  name: string;
  plan_data: any;
  is_active: boolean;
  created_at: string;
}

interface RehabPlanRow {
  id: string;
  name: string;
  injury_description: string;
  plan_data: any;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const [hasCoach, setHasCoach] = useState(false);
  const [coachName, setCoachName] = useState<string>("");
  const [clubName, setClubName] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [demoDaysLeft, setDemoDaysLeft] = useState<number | null>(null);
  const [demoDaysUntilDeletion, setDemoDaysUntilDeletion] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingRehab, setGeneratingRehab] = useState(false);
  const [rehabInjury, setRehabInjury] = useState("");
  const [rehabPlan, setRehabPlan] = useState<any>(null);
  const [rehabPlans, setRehabPlans] = useState<RehabPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextEvent, setNextEvent] = useState<{ name: string; event_date: string; location: string | null; priority: string } | null>(null);
  const [clubSeason, setClubSeason] = useState<{ plan: any; phases: any[]; template: any[] } | null>(null);
  type TabKey = "hub" | "plan" | "rehab" | "mental" | "progress" | "nutrition" | "testing" | "calendar";
  const VALID_TABS: TabKey[] = ["hub", "plan", "rehab", "mental", "progress", "nutrition", "testing", "calendar"];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab") as TabKey | null;
    return t && VALID_TABS.includes(t) ? t : "hub";
  })();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [nutritionView, setNutritionView] = useState<"home" | "planner" | "recipes">("home");
  const [seenDots, setSeenDots] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("navDots_seen");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  function markDotSeen(key: string) {
    setSeenDots((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      try { localStorage.setItem("navDots_seen", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const { isCoachMode, setCoachMode } = useCoachMode();
  const coachAthleteMode = isCoachMode ? "coach" : "athlete";
  const setCoachAthleteMode = (mode: "coach" | "athlete") => setCoachMode(mode === "coach");
  const [chatOpen, setChatOpen] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [showMentalReminder, setShowMentalReminder] = useState(false);
  const [pinsEditorOpen, setPinsEditorOpen] = useState(false);
  const DEFAULT_PINS = ["plan", "progress", "competitions", "match"];
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("hub_pinned_modules");
      return raw ? JSON.parse(raw) : DEFAULT_PINS;
    } catch { return DEFAULT_PINS; }
  });
  const savePins = (keys: string[]) => {
    setPinnedKeys(keys);
    try { localStorage.setItem("hub_pinned_modules", JSON.stringify(keys)); } catch { /* ignore */ }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  
  const { isLocked: isModuleLocked } = useEntitlements();
  const { isModuleEnabled } = useAthleteModuleAccess();
  const { isFromCache: profileFromCache, cachedAt: profileCachedAt } = useOfflineProfile();
  const { plan: offlinePlan, online: planOnline } = useOfflinePlan();
  const { role } = useRole();

  // Coaches go straight to their own dashboard — no role toggle.
  useEffect(() => {
    if (role === "coach") {
      navigate("/coach", { replace: true });
    }
  }, [role, navigate]);

  // Sync activeTab → URL ?tab= so browser back/refresh works.
  useEffect(() => {
    const current = searchParams.get("tab");
    if (activeTab === "hub") {
      if (current) {
        const next = new URLSearchParams(searchParams);
        next.delete("tab");
        setSearchParams(next, { replace: false });
      }
    } else if (current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", activeTab);
      setSearchParams(next, { replace: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Sync URL → activeTab (browser back/forward navigation).
  useEffect(() => {
    const t = (searchParams.get("tab") as TabKey | null) ?? "hub";
    const next = t && VALID_TABS.includes(t) ? t : "hub";
    if (next !== activeTab) setActiveTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Map dashboard tabs to entitlement modules. Tabs not in this map are never tier-locked.
  const TAB_TO_MODULE: Partial<Record<TabKey, LockedModule>> = {
    rehab: "rehab",
    testing: "testing",
  };
  const isTierLockedTab = (tab: TabKey) => {
    const mod = TAB_TO_MODULE[tab];
    return mod ? isModuleLocked(mod) : false;
  };

  const BackToHub = ({ onBack, label }: { onBack: () => void; label: string }) => (
    <div className="mb-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-11 sm:h-9">
        <ArrowLeft className="h-4 w-4 mr-1" /> {label}
      </Button>
    </div>
  );
  const isDemoLockedTab = (tab: TabKey) => isDemo && !["hub", "plan"].includes(tab);
  const handleTabChange = (tab: TabKey) => {
    if (isDemoLockedTab(tab)) return;
    if (isTierLockedTab(tab)) {
      navigate("/pricing");
      return;
    }
    setActiveTab(tab);
    setMenuOpen(false);
  };
  const ALL_PINNABLE = [
    { key: "plan",         icon: Zap,           labelKey: "plan",            color: "text-tab-plan",      onClick: () => handleTabChange("plan") },
    { key: "progress",     icon: BarChart3,     labelKey: "progress",        color: "text-tab-progress",  onClick: () => handleTabChange("progress") },
    { key: "competitions", icon: Trophy,        labelKey: "competitions",    color: "text-explosive",     onClick: () => navigate("/competitions") },
    { key: "mental",       icon: Brain,         labelKey: "mental",          color: "text-tab-mental",    onClick: () => handleTabChange("mental") },
    { key: "nutrition",    icon: Apple,         labelKey: "nutrition",       color: "text-tab-nutrition", onClick: () => handleTabChange("nutrition") },
    { key: "rehab",        icon: Heart,         labelKey: "injuryRehabPlan", color: "text-tab-rehab",     onClick: () => handleTabChange("rehab") },
    { key: "diary",        icon: NotebookPen,   labelKey: "diary",           color: "text-primary",       onClick: () => navigate("/diary") },
    { key: "testing",      icon: ClipboardList, labelKey: "testing",         color: "text-primary",       onClick: () => handleTabChange("testing") },
    { key: "calendar",     icon: CalendarIcon,  labelKey: "seasonCalendar",  color: "text-primary",       onClick: () => handleTabChange("calendar") },
    { key: "match",        icon: VideoIcon,     labelKey: "hubMatchTitle",   color: "text-primary",       onClick: () => navigate("/match-analysis/me") },
  ] as const;
  const renderDemoLockedState = (featureKey: string) => (
    <div className="rounded-xl border border-border bg-card p-8 sm:p-10 text-center shadow-card space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-foreground">{t(featureKey)}</h3>
        <p className="text-sm text-muted-foreground">{t("demoLockedFeatureDesc")}</p>
        <p className="text-sm text-foreground">{t("demoUpgradePrompt")}</p>
      </div>
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
          {t("viewPricing")}
        </Button>
      </div>
    </div>
  );

  const renderTierLockedState = (featureKey: string) => (
    <div className="rounded-xl border border-primary/20 bg-card p-8 sm:p-10 text-center shadow-card space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-foreground">{t(featureKey)}</h3>
        <p className="text-sm text-muted-foreground">{t("moduleLockedDesc")}</p>
      </div>
      <div className="flex justify-center">
        <Button size="sm" onClick={() => navigate("/pricing")}>
          <Sparkles className="h-4 w-4 mr-1" /> {t("upgradeToUnlock")}
        </Button>
      </div>
    </div>
  );

  const renderModuleDisabledState = () => (
    <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
      <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-foreground">{t("moduleNotAvailable")}</h3>
      <p className="text-sm text-muted-foreground">{t("moduleNotAvailableDesc")}</p>
    </div>
  );

  const TAB_MODULE_MAP: Partial<Record<TabKey, string>> = {
    progress: "progress",
    mental: "mental",
    nutrition: "nutrition",
    testing: "testing",
    rehab: "rehab",
  };
  const isTabModuleDisabled = (tab: TabKey) => {
    const m = TAB_MODULE_MAP[tab];
    return m ? !isModuleEnabled(m) : false;
  };

  const NAV_ITEMS: { tab: typeof activeTab; icon: typeof Home; labelKey: string; color: string }[] = [
    { tab: "hub", icon: Home, labelKey: "hubWelcome", color: "text-primary" },
    { tab: "plan", icon: Zap, labelKey: "plan", color: "text-tab-plan" },
    { tab: "calendar", icon: CalendarRange, labelKey: "seasonCalendar", color: "text-primary" },
    { tab: "progress", icon: BarChart3, labelKey: "progress", color: "text-tab-progress" },
    
    { tab: "rehab", icon: Heart, labelKey: "injuryRehabPlan", color: "text-tab-rehab" },
    { tab: "mental", icon: Brain, labelKey: "mental", color: "text-tab-mental" },
    { tab: "testing", icon: ClipboardList, labelKey: "testing", color: "text-primary" },
    
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Auto-flush queued offline workout logs when connectivity returns.
  useEffect(() => {
    const onOnline = async () => {
      try {
        const { syncWorkoutLogs } = await import("@/lib/workoutLogSyncEngine");
        await syncWorkoutLogs();
      } catch { /* best effort */ }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const PLANS_CACHE_KEY = `cached_training_plans:${user.id}`;
    const PROFILE_CACHE_KEY = `cached_profile:${user.id}`;

    // If we're offline, hydrate from local cache so the user can still see today's plan.
    if (!navigator.onLine) {
      try {
        const cachedProfile = localStorage.getItem(PROFILE_CACHE_KEY);
        const cachedPlans = localStorage.getItem(PLANS_CACHE_KEY);
        if (cachedProfile) setProfile(JSON.parse(cachedProfile) as Profile);
        if (cachedPlans) setPlans(JSON.parse(cachedPlans) as TrainingPlan[]);
      } catch { /* ignore cache parse errors */ }
      setLoading(false);
      return;
    }

    // Update last_seen_at for online tracking
    supabase.from("profiles").update({ last_seen_at: new Date().toISOString() } as any).eq("user_id", user.id).then(() => {});
    const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (adminCheck) setIsAdmin(true);

    // Check coach role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const coachOrAdmin = roles?.some((r: any) => r.role === "coach" || r.role === "admin");
    if (coachOrAdmin) {
      setIsCoach(true);
      // Only auto-flip to coach mode on first load (no stored preference)
      if (typeof window !== "undefined" && !localStorage.getItem("tkd-coach-mode")) {
        setCoachAthleteMode("coach");
      }
    }

    // Check if user has a coach assigned
    const { data: coachLink } = await supabase.from("coach_athletes").select("coach_id").eq("athlete_id", user.id).limit(1);
    if (coachLink && coachLink.length > 0) {
      setHasCoach(true);
      const { data: coachProfile } = await supabase.from("profiles").select("display_name").eq("user_id", coachLink[0].coach_id).single();
      if (coachProfile?.display_name) setCoachName(coachProfile.display_name);
    }

    const [profileRes, plansRes, rehabRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("training_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("rehab_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profileRes.data) {
      const profileData = profileRes.data as any;
      if (profileData.is_parent) {
        navigate("/parent-dashboard");
        return;
      }
      if (!profileData.is_approved) {
        navigate("/pending-approval");
        return;
      }
      if (!profileData.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      if (!profileData.club_id) {
        navigate("/profile-setup");
        return;
      }
      if (profileData && (profileData as any).age == null && profileData?.birth_date) {
        const bd = new Date(profileData.birth_date);
        const today = new Date();
        let a = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
        if (a > 0) (profileData as any).age = a;
      }
      setProfile(profileData as Profile);
      if (profileData?.birth_date) {
        const today = new Date();
        const bday = new Date(profileData.birth_date);
        if (today.getDate() === bday.getDate() && today.getMonth() === bday.getMonth()) {
          setIsBirthday(true);
        }
      }
      try { localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData)); } catch { /* quota */ }
      const { data: clubData } = await supabase
        .from("clubs" as any)
        .select("name")
        .eq("id", profileData.club_id)
        .maybeSingle();
      setClubName((clubData as { name?: string } | null)?.name || "");
      // Active club season (read-only). Only show if athlete is in visibility list OR is the creator.
      try {
        const { data: seasonRow } = await (supabase.from as any)("club_season_plans")
          .select("*, club_season_phases(*), club_season_day_templates(*)")
          .eq("club_id", profileData.club_id).eq("is_active", true).maybeSingle();
        if (seasonRow) {
          // Show to everyone in the club by default (opt-out model)
          // Only hide if coach has explicitly set visibility AND the athlete is not included
          const { data: visRows } = await (supabase.from as any)("club_season_plan_visibility")
            .select("athlete_id")
            .eq("season_plan_id", seasonRow.id);

          const hasAnyVisibilitySet = visRows && visRows.length > 0;
          const athleteIsIncluded = visRows?.some((v: any) => v.athlete_id === user.id) || seasonRow.created_by === user.id;

          // If no visibility rows exist at all, show to everyone
          // If visibility rows exist, only show to included athletes
          if (!hasAnyVisibilitySet || athleteIsIncluded) {
            setClubSeason({
              plan: seasonRow,
              phases: seasonRow.club_season_phases || [],
              template: seasonRow.club_season_day_templates || [],
            });
          }
        }
      } catch { /* table may not exist yet */ }
      setIsPaid(profileData.payment_status === "paid");
      if (profileData.is_demo && profileData.payment_status !== "paid") {
        setIsDemo(true);
        const created = new Date(profileData.created_at);
        const demoExpiry = new Date(created);
        demoExpiry.setDate(demoExpiry.getDate() + 14);
        const deletionDate = new Date(created);
        deletionDate.setDate(deletionDate.getDate() + 21);
        const now = new Date();
        const daysLeftDemo = Math.ceil((demoExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDemoDaysLeft(daysLeftDemo);
        setDemoDaysUntilDeletion(daysUntilDeletion);
      }
    }
    if (plansRes.data) {
      const plansList = plansRes.data as unknown as TrainingPlan[];
      setPlans(plansList);
      // Cache plans so the athlete can still view today's session offline.
      try { localStorage.setItem(PLANS_CACHE_KEY, JSON.stringify(plansList)); } catch { /* quota */ }
    }
    if (rehabRes.data) {
      setRehabPlans(rehabRes.data as unknown as RehabPlanRow[]);
      const active = (rehabRes.data as unknown as RehabPlanRow[]).find(r => r.is_active);
      if (active) setRehabPlan(active.plan_data);
    }

    // Fetch next upcoming competition / camp (today or later)
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: nextComp } = await supabase
      .from("competitions")
      .select("name, event_date, location, priority")
      .eq("user_id", user.id)
      .gte("event_date", todayIso)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    setNextEvent((nextComp as any) || null);

    // Monthly mental assessment reminder
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: lastMental } = await supabase
        .from("mental_assessments")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const isDue = !lastMental || (lastMental as any).created_at < thirtyDaysAgo;
      setShowMentalReminder(isDue && isModuleEnabled("mental"));
    } catch { /* ignore */ }

    setLoading(false);
  };

  const generatePlan = async () => {
    if (!profile) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile, language: locale },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deactivate existing plans before inserting new one
      await supabase
        .from("training_plans")
        .update({ is_active: false })
        .eq("user_id", user.id);

      const { error: insertError } = await supabase.from("training_plans").insert({
        user_id: user.id,
        name: data.plan.planName || "Generated Plan",
        plan_data: data.plan,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast({ title: t("planGenerated"), description: t("planGeneratedDesc") });
      loadData();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generateRehabPlan = async () => {
    if (!rehabInjury.trim()) {
      toast({ title: t("describeInjury"), variant: "destructive" });
      return;
    }
    setGeneratingRehab(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-rehab-plan", {
        body: { injury: rehabInjury, profile, language: locale },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await supabase.from("rehab_plans").update({ is_active: false } as any).eq("user_id", user.id);

      await supabase.from("rehab_plans").insert({
        user_id: user.id,
        name: data.plan.rehabPlanName || "Rehab Plan",
        injury_description: rehabInjury,
        plan_data: data.plan,
        is_active: true,
      } as any);

      setRehabPlan(data.plan);
      toast({ title: t("rehabGenerated") });
      loadData();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setGeneratingRehab(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return <SplashScreen />;
  }

  const activePlan = plans.find((p) => p.is_active);

  return (
    <div className="min-h-screen pb-16 sm:pb-0 relative" style={{ backgroundColor: "#0a0a0a" }}>
      <Watermark />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Sportstalent" className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-contain" />
              <span className="text-sm sm:text-base font-extrabold text-foreground">SPORTSTALENT</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <EventRemindersDropdown />
              <button
                onClick={() => navigate("/profile-setup")}
                className="relative shrink-0"
                aria-label={t("profile")}
              >
                <AvatarImg
                  avatarUrl={profile?.avatar_url}
                  className="h-8 w-8 rounded-full object-cover border border-border"
                  fallbackClassName="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border"
                />
                <span className={cn(
                  "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500" : "bg-destructive"
                )} />
              </button>
              <Button variant="ghost" size="icon" onClick={() => { setMenuOpen(true); markDotSeen("role_update"); }} className="relative">
                <Menu className="h-5 w-5" />
                {!seenDots.has("role_update") && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-72 max-w-[85vw] bg-card border-border p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="sr-only">{t("menu") || "Menu"}</SheetTitle>
            <div className="flex items-center gap-3">
              <AvatarImg
                avatarUrl={profile?.avatar_url}
                className="h-11 w-11 rounded-full object-cover border-2 border-primary/30 shrink-0"
                fallbackClassName="h-11 w-11 rounded-full bg-muted flex items-center justify-center border-2 border-primary/30 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{profile?.display_name || "Athlete"}</p>
                {clubName && <p className="text-xs text-muted-foreground truncate">{clubName}</p>}
                {profile?.belt_level && (
                  <Badge variant="outline" className="capitalize text-[10px] mt-1">{profile.belt_level}</Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {NAV_ITEMS.map(({ tab, icon: Icon, labelKey, color }) => {
              const locked = isDemoLockedTab(tab);
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  disabled={locked}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? `${color} bg-accent font-semibold` : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  } ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t(labelKey)}</span>
                  {locked && <Lock className="h-3 w-3 ms-auto shrink-0" />}
                </button>
              );
            })}
            <button
              onClick={() => { setMenuOpen(false); navigate("/library"); }}
              disabled={isDemo}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground ${isDemo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("library")}</span>
              {isDemo && <Lock className="h-3 w-3 ms-auto shrink-0" />}
            </button>

            <Separator className="my-2" />

            {/* Utilities */}
            <button onClick={() => { setMenuOpen(false); navigate("/profile-setup"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
              <User className="h-4 w-4 shrink-0" />
              <span>{t("profile")}</span>
            </button>
            <button onClick={() => { setMenuOpen(false); navigate("/health"); }} className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
              <span className="relative inline-flex">
                <Watch className="h-4 w-4 shrink-0" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" aria-hidden="true" />
              </span>
              <span>{t("healthPageTitle" as any) || "Health"}</span>
            </button>
            {coachAthleteMode === "coach" && isCoach ? (
              <button onClick={() => { setMenuOpen(false); navigate("/hold/moduler"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
                <Settings className="h-4 w-4 shrink-0" />
                <span>Administrer moduler</span>
              </button>
            ) : (
              <button onClick={() => { setMenuOpen(false); navigate("/moduler"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
                <LayoutGrid className="h-4 w-4 shrink-0" />
                <span>Moduler</span>
              </button>
            )}
            {isAdmin && (
              <button onClick={() => { setMenuOpen(false); navigate("/admin/approval"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
                <Shield className="h-4 w-4 shrink-0" />
                <span>{t("admin")}</span>
              </button>
            )}
            <button onClick={() => { setMenuOpen(false); setHelpOpen(true); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>{t("helpTitle")}</span>
            </button>

          </nav>

          {/* Sign out */}
          <div className="border-t border-border p-3">
            <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer">
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t("signOut") || "Sign Out"}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Help Sheet */}
      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("helpTitle")}</SheetTitle>
          </SheetHeader>
          <Help />
        </SheetContent>
      </Sheet>

      {/* Mobile bottom nav — 5 tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm sm:hidden pb-safe">
        <div className="flex items-stretch justify-around px-1 pt-1.5">
          {(coachAthleteMode === "coach" && isCoach ? [
            { key: "coach-hold", label: t("coachNav") || "Hold", icon: Users, active: false, onClick: () => navigate("/coach") },
            { key: "coach-traening", label: t("train") || "Træning", icon: CalendarRange, active: false, onClick: () => navigate("/coach/season-calendar") },
            { key: "coach-staevner", label: t("competitions") || "Stævner", icon: Trophy, active: false, onClick: () => navigate("/coach/competitions") },
            { key: "coach-surveys", label: t("surveysTitle") || "Evalueringer", icon: ClipboardList, active: false, onClick: () => navigate("/coach/surveys") },

          ] : [
            { key: "idag", label: t("today") || "I dag", icon: Home, active: activeTab === "hub", onClick: () => handleTabChange("hub") },
            { key: "traen", label: t("train") || "Træn", icon: Zap, active: activeTab === "plan", onClick: () => handleTabChange("plan") },
            { key: "kalender", label: t("seasonCalendar") || "Kalender", icon: CalendarRange, active: activeTab === "calendar", onClick: () => handleTabChange("calendar") },
            { key: "dagbog", label: t("diary") || "Dagbog", icon: NotebookPen, active: false, onClick: () => navigate("/diary") },
            { key: "video", label: t("hubMatchTitle") || "Video", icon: VideoIcon, active: false, onClick: () => navigate("/match-analysis/me") },
          ]).map(({ key, label, icon: Icon, active, onClick }) => (
            <button
              key={key}
              onClick={() => {
                import("@/lib/haptics").then(h => h.tap()).catch(() => {});
                onClick();
              }}
              aria-label={label}
              className={cn(
                "relative flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors active:scale-95",
                active ? "text-primary" : "text-muted-foreground"
              )}
              style={{ minHeight: 48 }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[9px] font-semibold uppercase tracking-wide leading-tight truncate max-w-full">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <InviteWelcomeBanner />
        {isDemo && demoDaysLeft !== null && demoDaysLeft <= 0 ? (
          <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <span className="text-lg font-bold text-destructive">{t("demoBannerExpired")}</span>
            </div>
            <p className="text-sm text-foreground">{t("demoExpiredMessage")}</p>
            {demoDaysUntilDeletion !== null && demoDaysUntilDeletion > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/20 p-3">
                <Clock className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm font-bold text-destructive">
                  {demoDaysUntilDeletion} {t("demoExpiredDaysUntilDeletion")}
                </span>
              </div>
            )}
            {demoDaysUntilDeletion !== null && demoDaysUntilDeletion <= 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/30 p-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm font-bold text-destructive">{t("demoDeletionImminent")}</span>
              </div>
            )}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("paypalTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("paypalInstruction")}</p>
              <p className="text-lg font-bold text-primary font-mono">rashid3105@gmail.com</p>
              <p className="text-sm text-muted-foreground">{t("paypalReference")}</p>
            </div>
            <Button onClick={() => navigate("/pricing")} className="w-full sm:w-auto">
              {t("viewPricing")}
            </Button>
          </div>
        ) : isDemo && demoDaysLeft !== null && (
          <div className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 ${
            demoDaysLeft <= 3
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/5 text-primary"
          }`}>
            <Clock className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-bold">{t("demoBannerTitle")}</span>
              <span className="text-sm ml-2">
                {demoDaysLeft > 0
                  ? `${demoDaysLeft} ${t("demoBannerDaysLeft")}`
                  : t("demoBannerExpiresToday")}
              </span>
            </div>
          </div>
        )}
        {hasCoach && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3 sm:p-4">
            <Lock className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm text-foreground">
              {coachName
                ? (t("coachManagedBannerNamed") || "").replace("{{coach}}", coachName)
                : t("coachManagedBanner")}
            </p>
          </div>
        )}
        {activeTab === "hub" ? (
          <div className="space-y-4">
            {isBirthday && (
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 border border-amber-500/30 px-4 py-4 flex items-center gap-3">
                <span className="text-3xl">🎂</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    {t("birthdayTitle") || `Tillykke med fødselsdagen, ${profile?.display_name?.split(" ")[0] ?? ""}!`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("birthdayDesc") || "Nyd din dag — og måske en ekstra snack i dag 😄"}
                  </p>
                </div>
              </div>
            )}
            {/* Conditional readiness banner (top of scrollable content) */}
            {!isDemo && <HubReadinessBanner />}

            {showMentalReminder && (
              <div
                className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleTabChange("mental")}
              >
                <Brain className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t("mentalReminderTitle") || "Månedlig mental gennemgang"}</p>
                  <p className="text-xs text-muted-foreground">{t("mentalReminderDesc") || "Det er over 30 dage siden din sidste vurdering — tager under 2 min"}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            )}

            {/* Greeting line — bigger profile picture */}
            <div className="flex items-center gap-3 px-1">
              <div className="relative shrink-0">
                <AvatarImg
                  avatarUrl={profile?.avatar_url}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-border"
                  fallbackClassName="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center border-2 border-border"
                />
                <span
                  className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                    isOnline ? "bg-green-500" : "bg-destructive"
                  )}
                />
              </div>
              <div className="min-w-0">
                {(() => {
                  const fullName = profile?.display_name?.trim() || "";
                  const firstName = fullName ? fullName.split(/\s+/)[0] : "Athlete";
                  const hour = new Date().getHours();
                  const greetingKey =
                    hour >= 5 && hour < 12 ? "greetingMorning" :
                    hour >= 12 && hour < 18 ? "greetingAfternoon" :
                    "greetingEvening";
                  return (
                    <>
                      <p className="text-xs text-muted-foreground">{t(greetingKey)}</p>
                      <p className="text-lg font-bold text-foreground truncate">{firstName}</p>
                      {profileFromCache && (
                        <p className="text-[10px] text-muted-foreground/80 truncate">
                          {t("profileCachedHint" as any) || "Vises fra cache"}
                          {profileCachedAt ? ` · ${new Date(profileCachedAt).toLocaleDateString()}` : ""}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Athlete dashboard (coaches are redirected to /coach) */}
            <AthleteDashboard />


            {/* 1. Today's session hero — hidden behind feature flag (erstattet af AthleteDashboard) */}
            {SHOW_LEGACY_HUB_SECTIONS && (
              <HubTodayHero
                activePlan={activePlan}
                onGoToPlan={() => handleTabChange("plan")}
              />
            )}

            {/* 2. Next event countdown — hidden behind feature flag (erstattet af AthleteDashboard) */}
            {SHOW_LEGACY_HUB_SECTIONS && <HubNextEvent event={nextEvent} />}



            {/* 3. Recovery strip — hidden behind feature flag (kan genaktiveres) */}
            {SHOW_LEGACY_HUB_SECTIONS && !isDemo && <HubRecoveryStrip />}

            {/* Optional reflection prompt — hidden behind feature flag */}
            {SHOW_LEGACY_HUB_SECTIONS && !isDemo && <ReflectionPromptCard />}

            {/* 4. Pinned modules — hidden behind feature flag (kan genaktiveres) */}
            {SHOW_LEGACY_HUB_SECTIONS && (
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("pinnedModules")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPinsEditorOpen(true)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>{t("customizePins") || "Tilpas"}</span>
                  </button>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  {pinnedKeys
                    .map(k => ALL_PINNABLE.find(m => m.key === k))
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((mod) => {
                      const Icon = mod!.icon;
                      const locked = isDemo && !["plan"].includes(mod!.key);
                      return (
                        <button
                          key={mod!.key}
                          type="button"
                          onClick={() => !locked && mod!.onClick()}
                          disabled={locked}
                          className={cn(
                            "group relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 shadow-card text-left transition-all",
                            locked ? "opacity-60 cursor-not-allowed" : "hover:border-primary/30 hover:-translate-y-0.5"
                          )}
                        >
                          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 mb-2")}>
                            <Icon className={cn("h-4 w-4", mod!.color)} />
                            {locked && <Lock className="absolute right-3 top-3 h-3 w-3 text-muted-foreground" />}
                          </div>
                          <p className="text-sm font-bold text-foreground tracking-tight truncate">{t(mod!.labelKey as any)}</p>
                        </button>
                      );
                    })}
                </div>
              </section>
            )}

            {/* 5. Other modules chips — hidden behind feature flag (kan genaktiveres) */}
            {SHOW_LEGACY_HUB_SECTIONS && (
              <HubOtherModules
                isDemo={isDemo}
                isLocked={(mod) => isModuleLocked(mod) || (mod === "rehab" && !isModuleEnabled("rehab")) || (mod === "testing" && !isModuleEnabled("testing"))}
                onTab={(tab) => handleTabChange(tab)}
              />
            )}


            {/* Demoted: passkey — hidden behind feature flag */}
            {SHOW_LEGACY_HUB_SECTIONS && !isDemo && <EnablePasskeyCard />}

            {/* Diary entry point removed from hub — available via floating UI / bottom nav */}

            {/* Profile quick-link — hidden behind feature flag (reachable via header avatar) */}
            {SHOW_LEGACY_HUB_SECTIONS && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/profile-setup")}>
                  <User className="h-4 w-4 mr-1" /> {t("profile")}
                </Button>
              </div>
            )}
          </div>

        ) : activeTab === "calendar" ? (
          <>
            <BackToHub onBack={() => handleTabChange("hub")} label={t("back") || "Back"} />
            {!clubSeason?.plan ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <CalendarRange className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-foreground">{t("seasonCalendar")}</h3>
                <p className="text-sm text-muted-foreground">{t("seasonNoCalendarYet")}</p>
              </div>
            ) : (
              <SeasonCalendarView
                seasonPlan={clubSeason.plan}
                phases={clubSeason.phases}
                template={clubSeason.template}
              />
            )}
          </>
        ) : activeTab === "progress" ? (
          <><BackToHub onBack={() => handleTabChange("hub")} label={t("back") || "Back"} />{isTabModuleDisabled("progress") ? renderModuleDisabledState() : isDemo ? renderDemoLockedState("progress") : <ProgressDashboard onGoToPlan={() => handleTabChange("plan")} />}</>
        ) : activeTab === "nutrition" ? (
          <>
            <BackToHub onBack={() => { setNutritionView("home"); handleTabChange("hub"); }} label={t("back") || "Back"} />
            {isTabModuleDisabled("nutrition") ? renderModuleDisabledState() : isDemo ? renderDemoLockedState("nutrition") : (
              nutritionView === "home" ? (
                <div className="space-y-4">
                  <Card
                    className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => setNutritionView("planner")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Camera className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{t("nutritionPlannerTitle") || "Kostplanlægger & madregistrering"}</p>
                        <p className="text-xs text-muted-foreground">{t("nutritionPlannerDesc") || "AI madscanner, log måltider og se dagens kalorier"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                    </div>
                  </Card>
                  <Card
                    className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => setNutritionView("recipes")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{t("nutritionRecipesTitle") || "Alle opskrifter"}</p>
                        <p className="text-xs text-muted-foreground">{t("nutritionRecipesDesc") || "Sund mad tilpasset taekwondo-atleter"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                    </div>
                  </Card>
                </div>
              ) : nutritionView === "planner" ? (
                <div className="space-y-4">
                  <button onClick={() => setNutritionView("home")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> {t("back") || "Tilbage"}
                  </button>
                  <h2 className="font-bold">{t("nutritionPlannerTitle") || "Kostplanlægger & madregistrering"}</h2>
                  <FoodScanner />
                  <NutritionPlan profile={profile} readOnly={hasCoach && !isPaid} />
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={() => setNutritionView("home")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> {t("back") || "Tilbage"}
                  </button>
                  <NutritionLibrary />
                </div>
              )
            )}
          </>
        ) : activeTab === "mental" ? (
          <><BackToHub onBack={() => handleTabChange("hub")} label={t("back") || "Back"} />{isTabModuleDisabled("mental") ? renderModuleDisabledState() : isDemo ? renderDemoLockedState("mental") : <MentalAssessment profile={profile} />}</>
        ) : activeTab === "testing" ? (
          <><BackToHub onBack={() => handleTabChange("hub")} label={t("back") || "Back"} />{isTabModuleDisabled("testing") ? renderModuleDisabledState() : isDemo ? renderDemoLockedState("testing") : isModuleLocked("testing") ? renderTierLockedState("testing") : <PhysicalTesting mode={isCoach ? "coach" : "individual"} />}</>
        ) : activeTab === "rehab" ? (
          <><BackToHub onBack={() => handleTabChange("hub")} label={t("back") || "Back"} />{isTabModuleDisabled("rehab") ? renderModuleDisabledState() : isDemo ? renderDemoLockedState("injuryRehabPlan") : isModuleLocked("rehab") ? renderTierLockedState("injuryRehabPlan") : (
          <>
            {/* Rehab Plan Generator */}
            {(!hasCoach || isPaid) && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  <h3 className="font-bold text-foreground">{t("injuryRehabPlan")}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("rehabDescription")}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={rehabInjury}
                    onChange={(e) => setRehabInjury(e.target.value)}
                    placeholder={t("rehabPlaceholder")}
                    maxLength={200}
                    className="flex-1"
                  />
                  <Button onClick={generateRehabPlan} disabled={generatingRehab || !rehabInjury.trim()} size="sm" className="w-full sm:w-auto">
                    {generatingRehab ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
                    ) : (
                      <><Heart className="h-4 w-4 mr-1" /> {t("generateRehabPlan")}</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Rehab plan result */}
            {rehabPlan && (
              <RehabPlanCard plan={rehabPlan} onDelete={hasCoach && !isPaid ? undefined : async () => {
                const activeRP = rehabPlans.find(r => r.is_active);
                if (activeRP) {
                  await supabase.from("rehab_plans").delete().eq("id", activeRP.id);
                  setRehabPlan(null);
                  loadData();
                }
              }} />
            )}

            {/* Medical document translator */}
            <MedicalDocumentTranslator />

            {/* Previous rehab plans */}
            {rehabPlans.filter(p => !p.is_active).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{t("previousRehabPlans")}</h3>
                <div className="space-y-3">
                  {rehabPlans.filter(p => !p.is_active).map((rp) => (
                    <div key={rp.id} className="rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{rp.name}</p>
                        <p className="text-xs text-muted-foreground">{rp.injury_description} · {new Date(rp.created_at).toLocaleDateString()}</p>
                      </div>
                      {(!hasCoach || isPaid) && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;
                            await supabase.from("rehab_plans").update({ is_active: false } as any).eq("user_id", user.id);
                            await supabase.from("rehab_plans").update({ is_active: true } as any).eq("id", rp.id);
                            loadData();
                          }}>
                            {t("activate")}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                            await supabase.from("rehab_plans").delete().eq("id", rp.id);
                            loadData();
                          }}>
                            {t("delete")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
          )}</>
        ) : (
          <>
            <BackToHub onBack={() => handleTabChange("hub")} label={t("back") || "Back"} />
            {/* Profile summary */}
            {profile && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <AvatarImg avatarUrl={profile.avatar_url} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-border flex-shrink-0" fallbackClassName="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center border-2 border-border flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted flex items-center justify-center border-2 border-border flex-shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      {profile.athlete_code && (
                        <p className="text-[10px] text-muted-foreground font-mono">{t("yourAthleteCode")}: {profile.athlete_code}</p>
                      )}
                      {clubName && (
                        <p className="text-xs text-muted-foreground mt-1">{t("club")}: <span className="text-foreground font-medium">{clubName}</span></p>
                      )}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        {profile.belt_level && (
                          <span className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-2 py-0.5 sm:py-1 rounded-full capitalize">
                            {profile.belt_level} {t("belt")}
                          </span>
                        )}
                        {profile.age && (
                          <span className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-2 py-0.5 sm:py-1 rounded-full">
                            {profile.age}y
                          </span>
                        )}
                        {profile.weight_kg && (
                          <span className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-2 py-0.5 sm:py-1 rounded-full">
                            {profile.weight_kg}kg
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-2 py-0.5 sm:py-1 rounded-full">
                          {profile.tkd_sessions_per_week}x {t("tkdPerWeek")}
                        </span>
                      </div>
                      {profile.goals?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.goals.map((g) => (
                            <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {t(g) || g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={generatePlan} disabled={generating} size="sm" className="w-full sm:w-auto">
                    {generating ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-1" /> {t("generatePlan")}</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Offline notice when there's no usable plan */}
            {!planOnline && !activePlan && !offlinePlan && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Træningsplan ikke tilgængelig offline — åbn appen online én gang for at aktivere offline adgang.
              </div>
            )}

            {/* Active plan */}
            {activePlan ? (
              <div className="space-y-2">
                <AIPlanCard plan={activePlan} />
              </div>
            ) : (!hasCoach || isPaid) ? (
              <FeatureEmptyState
                icon={Zap}
                titleKey="emptyPlanTitle"
                descKey="emptyPlanDesc"
                ctaKey={generating ? "generating" : "emptyPlanCta"}
                onCta={generating ? undefined : generatePlan}
                accentClass="text-tab-plan"
                iconBgClass="bg-tab-plan/15"
              />
            ) : (
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 space-y-3 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold text-foreground">{t("coachManagesPlanTitle")}</h3>
                <p className="text-sm text-muted-foreground">{coachName
                  ? (t("coachManagesPlanDescNamed") || "").replace("{{coach}}", coachName)
                  : t("coachManagesPlanDesc")
                }</p>
                <p className="text-xs text-muted-foreground">{t("coachManagesPlanHint")}</p>
              </div>
            )}

            {/* Previous plans */}
            {plans.filter(p => !p.is_active).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{t("previousPlans")}</h3>
                <div className="space-y-3">
                  {plans.filter(p => !p.is_active).map((plan) => (
                    <div key={plan.id} className="rounded-lg border border-border bg-card/50 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(plan.created_at).toLocaleDateString()}</p>
                      </div>
                      {(!hasCoach || isPaid) && (
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;
                            await supabase.from("training_plans").update({ is_active: false }).eq("user_id", user.id);
                            await supabase.from("training_plans").update({ is_active: true }).eq("id", plan.id);
                            loadData();
                          }}>
                            {t("activate")}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("deleteTrainingPlan") || "Delete Training Plan"}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("deleteTrainingPlanConfirm") || "Are you sure you want to delete this training plan? This action cannot be undone."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                                  await supabase.from("training_plans").delete().eq("id", plan.id);
                                  loadData();
                                }}>
                                  {t("delete") || "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete active plan (bottom) */}
            {activePlan && (!hasCoach || isPaid) && (
              <div className="flex justify-end pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> {t("delete") || "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteTrainingPlan") || "Delete Training Plan"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteTrainingPlanConfirm") || "Are you sure you want to delete this training plan? This action cannot be undone."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                        await supabase.from("training_plans").delete().eq("id", activePlan.id);
                        loadData();
                      }}>
                        {t("delete") || "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </main>
      {/* Pin editor */}
      {pinsEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setPinsEditorOpen(false)}>
          <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-sm">{t("customizePins") || "Tilpas fastgjorte moduler"}</h2>
              <button onClick={() => setPinsEditorOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground px-4 pt-3">{t("customizePinsDesc") || "Vælg op til 4 moduler der skal vises på din forside."}</p>
            <div className="p-4 space-y-1.5 max-h-80 overflow-y-auto">
              {ALL_PINNABLE.map(mod => {
                const Icon = mod.icon;
                const checked = pinnedKeys.includes(mod.key);
                const maxReached = pinnedKeys.length >= 4 && !checked;
                return (
                  <label key={mod.key} className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
                    checked ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40",
                    maxReached && "opacity-40 cursor-not-allowed"
                  )}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={maxReached}
                      onChange={() => {
                        if (checked) {
                          savePins(pinnedKeys.filter(k => k !== mod.key));
                        } else if (!maxReached) {
                          savePins([...pinnedKeys, mod.key]);
                        }
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    <Icon className={cn("h-4 w-4 shrink-0", mod.color)} />
                    <span className="text-sm font-medium">{t(mod.labelKey as any)}</span>
                  </label>
                );
              })}
            </div>
            <div className="px-4 pb-4 pt-2">
              <button onClick={() => setPinsEditorOpen(false)} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold">
                {t("save") || "Gem"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} isCoach={isCoach} />
      <AppFooter />
    </div>
  );
}
