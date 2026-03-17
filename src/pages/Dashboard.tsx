import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, User, BookOpen, Plus, LogOut, Loader2, BarChart3, Heart, Shield, Users, Brain, Clock, Apple, Home, Lock, NotebookPen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIPlanCard } from "@/components/AIPlanCard";
import { RehabPlanCard } from "@/components/RehabPlanCard";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MentalAssessment } from "@/components/MentalAssessment";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { NutritionPlan } from "@/components/NutritionPlan";

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
  const [demoDaysLeft, setDemoDaysLeft] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingRehab, setGeneratingRehab] = useState(false);
  const [rehabInjury, setRehabInjury] = useState("");
  const [rehabPlan, setRehabPlan] = useState<any>(null);
  const [rehabPlans, setRehabPlans] = useState<RehabPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"hub" | "plan" | "rehab" | "mental" | "progress" | "nutrition">("hub");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const isDemoLockedTab = (tab: typeof activeTab) => isDemo && !["hub", "plan"].includes(tab);
  const handleTabChange = (tab: typeof activeTab) => {
    if (isDemoLockedTab(tab)) return;
    setActiveTab(tab);
  };
  const renderDemoLockedState = (featureKey: string) => (
    <div className="rounded-xl border border-border bg-card p-8 sm:p-10 text-center shadow-card space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-foreground">{t(featureKey as any)}</h3>
        <p className="text-sm text-muted-foreground">{t("demoLockedFeatureDesc" as any)}</p>
        <p className="text-sm text-foreground">{t("demoUpgradePrompt" as any)}</p>
      </div>
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
          {t("viewPricing")}
        </Button>
      </div>
    </div>
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    if (user.email === "rashid3105@gmail.com") setIsAdmin(true);

    // Check coach role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (roles?.some((r: any) => r.role === "coach")) setIsCoach(true);

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
      if (!profileData.is_approved) {
        navigate("/pending-approval");
        return;
      }
      if (!profileData.club_id) {
        navigate("/profile-setup");
        return;
      }
      setProfile(profileData as Profile);
      const { data: clubData } = await supabase
        .from("clubs" as any)
        .select("name")
        .eq("id", profileData.club_id)
        .maybeSingle();
      setClubName((clubData as { name?: string } | null)?.name || "");
      if (profileData.is_demo && profileData.payment_status !== "paid") {
        setIsDemo(true);
        const created = new Date(profileData.created_at);
        const expiry = new Date(created);
        expiry.setDate(expiry.getDate() + 14);
        const now = new Date();
        const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDemoDaysLeft(diff);
      }
    }
    if (plansRes.data) setPlans(plansRes.data as unknown as TrainingPlan[]);
    if (rehabRes.data) {
      setRehabPlans(rehabRes.data as unknown as RehabPlanRow[]);
      const active = (rehabRes.data as unknown as RehabPlanRow[]).find(r => r.is_active);
      if (active) setRehabPlan(active.plan_data);
    }
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

      const { error: insertError } = await supabase.from("training_plans").insert({
        user_id: user.id,
        name: data.plan.planName || "AI Generated Plan",
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = plans.find((p) => p.is_active);

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 space-y-2">
          {/* Logo row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm sm:text-base font-extrabold text-foreground">TKD POWER</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile-setup")}>
                <User className="h-4 w-4" />
              </Button>
              {isCoach && (
                <Button variant="ghost" size="icon" onClick={() => navigate("/coach")}>
                  <Users className="h-4 w-4" />
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/approval")}>
                  <Shield className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Menu row – left-aligned, below logo */}
          <nav className="hidden sm:flex items-center gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("hub")} className={activeTab === "hub" ? "text-primary" : ""}>
              <Home className="h-4 w-4 mr-1" /> {t("hubWelcome" as any)}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("plan")} className={activeTab === "plan" ? "text-tab-plan" : ""}>
              <Zap className="h-4 w-4 mr-1" /> {t("plan")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("progress")} disabled={isDemoLockedTab("progress")} className={activeTab === "progress" ? "text-tab-progress" : ""}>
              <BarChart3 className="h-4 w-4 mr-1" /> {t("progress")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("nutrition")} disabled={isDemoLockedTab("nutrition")} className={activeTab === "nutrition" ? "text-tab-nutrition" : ""}>
              <Apple className="h-4 w-4 mr-1" /> {t("nutrition")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("rehab")} disabled={isDemoLockedTab("rehab")} className={activeTab === "rehab" ? "text-tab-rehab" : ""}>
              <Heart className="h-4 w-4 mr-1" /> {t("injuryRehabPlan")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleTabChange("mental")} disabled={isDemoLockedTab("mental")} className={activeTab === "mental" ? "text-tab-mental" : ""}>
              <Brain className="h-4 w-4 mr-1" /> {t("mental")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/library")} disabled={isDemo}>
              <BookOpen className="h-4 w-4 mr-1" /> {t("library")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/diary")}>
              <NotebookPen className="h-4 w-4 mr-1" /> {t("diary" as any)}
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/approval")}>
                <Shield className="h-4 w-4 mr-1" /> {t("manageUsers")}
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm sm:hidden">
        <div className="flex items-center justify-around py-2">
          <button onClick={() => handleTabChange("hub")} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${activeTab === "hub" ? "text-primary" : "text-muted-foreground"}`}>
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button onClick={() => handleTabChange("plan")} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${activeTab === "plan" ? "text-tab-plan" : "text-muted-foreground"}`}>
            <Zap className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("plan")}</span>
          </button>
          <button onClick={() => handleTabChange("progress")} disabled={isDemoLockedTab("progress")} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${activeTab === "progress" ? "text-tab-progress" : "text-muted-foreground"} ${isDemoLockedTab("progress") ? "opacity-50" : ""}`}>
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("progress")}</span>
          </button>
          <button onClick={() => handleTabChange("nutrition")} disabled={isDemoLockedTab("nutrition")} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${activeTab === "nutrition" ? "text-tab-nutrition" : "text-muted-foreground"} ${isDemoLockedTab("nutrition") ? "opacity-50" : ""}`}>
            <Apple className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("nutrition")}</span>
          </button>
          <button onClick={() => handleTabChange("rehab")} disabled={isDemoLockedTab("rehab")} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${activeTab === "rehab" ? "text-tab-rehab" : "text-muted-foreground"} ${isDemoLockedTab("rehab") ? "opacity-50" : ""}`}>
            <Heart className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("rehab")}</span>
          </button>
          <button onClick={() => handleTabChange("mental")} disabled={isDemoLockedTab("mental")} className={`flex flex-col items-center gap-0.5 px-2 py-1 ${activeTab === "mental" ? "text-tab-mental" : "text-muted-foreground"} ${isDemoLockedTab("mental") ? "opacity-50" : ""}`}>
            <Brain className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("mental")}</span>
          </button>
          <button onClick={() => navigate("/diary")} className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
            <NotebookPen className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{t("diary" as any)}</span>
          </button>
        </div>
      </nav>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {isDemo && demoDaysLeft !== null && (
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
                  : demoDaysLeft === 0
                    ? t("demoBannerExpiresToday")
                    : t("demoBannerExpired")}
              </span>
            </div>
          </div>
        )}
        {hasCoach && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3 sm:p-4">
            <Lock className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm text-foreground">
              {coachName
                ? (t("coachManagedBannerNamed" as any) || "").replace("{{coach}}", coachName)
                : t("coachManagedBanner" as any)}
            </p>
          </div>
        )}
        {activeTab === "hub" ? (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-foreground">
                {t("hubWelcome" as any)}
              </h2>
              <p className="text-sm text-muted-foreground">{t("hubChooseSection" as any)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { tab: "plan" as const, icon: Zap, titleKey: "hubTrainingTitle", descKey: "hubTrainingDesc", color: "text-tab-plan", gradient: "radial-gradient(circle at 30% 50%, hsl(190 95% 50% / 0.08), transparent 70%)" },
                { tab: "progress" as const, icon: BarChart3, titleKey: "hubProgressTitle", descKey: isDemo ? "demoLockedFeatureDesc" : "hubProgressDesc", color: "text-tab-progress", gradient: "radial-gradient(circle at 30% 50%, hsl(45 90% 55% / 0.08), transparent 70%)", locked: isDemo },
                { tab: "nutrition" as const, icon: Apple, titleKey: "hubNutritionTitle", descKey: isDemo ? "demoLockedFeatureDesc" : "hubNutritionDesc", color: "text-tab-nutrition", gradient: "radial-gradient(circle at 30% 50%, hsl(120 60% 45% / 0.08), transparent 70%)", locked: isDemo },
                { tab: "rehab" as const, icon: Heart, titleKey: "hubRehabTitle", descKey: isDemo ? "demoLockedFeatureDesc" : "hubRehabDesc", color: "text-tab-rehab", gradient: "radial-gradient(circle at 30% 50%, hsl(0 72% 51% / 0.08), transparent 70%)", locked: isDemo },
                { tab: "mental" as const, icon: Brain, titleKey: "hubMentalTitle", descKey: isDemo ? "demoLockedFeatureDesc" : "hubMentalDesc", color: "text-tab-mental", gradient: "radial-gradient(circle at 30% 50%, hsl(330 60% 72% / 0.08), transparent 70%)", locked: isDemo },
              ] as const).map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.tab}
                    onClick={() => handleTabChange(section.tab)}
                    disabled={Boolean(section.locked)}
                    className={`group relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-card text-left transition-all duration-300 ${section.locked ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:border-primary/30 hover:-translate-y-1"}`}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: section.gradient, filter: "blur(40px)", zIndex: -1 }}
                    />
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary relative">
                        <Icon className={`h-5 w-5 ${section.color}`} />
                        {section.locked && <Lock className="absolute -right-1 -top-1 h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-foreground tracking-tight">{t(section.titleKey as any)}</h3>
                        <p className="text-xs leading-relaxed text-muted-foreground">{t(section.descKey as any)}</p>
                        {section.locked && <p className="text-xs font-medium text-foreground">{t("demoUpgradePrompt" as any)}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => !isDemo && navigate("/library")}
                disabled={isDemo}
                className={`group relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 shadow-card text-left transition-all duration-300 ${isDemo ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:border-primary/30 hover:-translate-y-1"}`}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(circle at 30% 50%, hsl(270 70% 55% / 0.08), transparent 70%)", filter: "blur(40px)", zIndex: -1 }}
                />
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary relative">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {isDemo && <Lock className="absolute -right-1 -top-1 h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground tracking-tight">{t("hubLibraryTitle" as any)}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{t((isDemo ? "demoLockedFeatureDesc" : "hubLibraryDesc") as any)}</p>
                    {isDemo && <p className="text-xs font-medium text-foreground">{t("demoUpgradePrompt" as any)}</p>}
                  </div>
                </div>
              </button>
            </div>

            {/* Quick link */}
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => navigate("/profile-setup")}>
                <User className="h-4 w-4 mr-1" /> {t("profile")}
              </Button>
            </div>
          </div>
        ) : activeTab === "progress" ? (
          <ProgressDashboard onGoToPlan={() => setActiveTab("plan")} />
        ) : activeTab === "nutrition" ? (
          <NutritionPlan profile={profile} readOnly={hasCoach} />
        ) : activeTab === "mental" ? (
          <MentalAssessment profile={profile} />
        ) : activeTab === "rehab" ? (
          <>
            {/* Rehab Plan Generator */}
            {!hasCoach && (
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
              <RehabPlanCard plan={rehabPlan} onDelete={hasCoach ? undefined : async () => {
                const activeRP = rehabPlans.find(r => r.is_active);
                if (activeRP) {
                  await supabase.from("rehab_plans").delete().eq("id", activeRP.id);
                  setRehabPlan(null);
                  loadData();
                }
              }} />
            )}

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
                      {!hasCoach && (
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
        ) : (
          <>
            {/* Profile summary */}
            {profile && (
              <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-border flex-shrink-0" />
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
                              {t(g as any) || g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {hasCoach ? (
                    <span className="text-xs text-accent font-semibold flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" /> {coachName
                        ? (t("coachManagedActionNamed" as any) || "").replace("{{coach}}", coachName)
                        : t("coachManagedAction" as any)}
                    </span>
                  ) : (
                    <Button onClick={generatePlan} disabled={generating} size="sm" className="w-full sm:w-auto">
                      {generating ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-1" /> {t("generatePlan")}</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Active plan */}
            {activePlan ? (
              <AIPlanCard plan={activePlan} />
            ) : (
              <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
                <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">{t("noTrainingPlanYet")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("noTrainingPlanDesc")}
                </p>
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
                      {!hasCoach && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) return;
                          await supabase.from("training_plans").update({ is_active: false }).eq("user_id", user.id);
                          await supabase.from("training_plans").update({ is_active: true }).eq("id", plan.id);
                          loadData();
                        }}>
                          {t("activate")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
