import { useEffect, useState } from "react";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ClubSwitcher } from "@/components/ClubSwitcher";
import { useCoachMode } from "@/contexts/CoachModeContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useClubTrial } from "@/hooks/useClubTrial";
import { CoachAthleteDetail } from "@/components/CoachAthleteDetail";
import { AvatarImg } from "@/components/AvatarImg";
import { isNativeApp } from "@/lib/platform";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { PlanViewDialog } from "@/components/PlanViewDialog";
import { DiaryComments } from "@/components/DiaryComments";
import { CoachDiaryView } from "@/components/coach/CoachDiaryView";
import { SquadOverview } from "@/components/coach/SquadOverview";
import { SquadPulse, type PulseFilter } from "@/components/coach/SquadPulse";
import { WeeklySquadExport } from "@/components/coach/WeeklySquadExport";
import { AthleteAddMenu } from "@/components/coach/AthleteAddMenu";
import { PendingAthletesSection } from "@/components/coach/PendingAthletesSection";

import { TeamWeeklyScheduleCard } from "@/components/coach/TeamWeeklyScheduleCard";
import { ClubActivityTypesCard } from "@/components/coach/ClubActivityTypesCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Loader2, Zap, User, Users, NotebookPen,
  MessageSquare, Building, CalendarRange, CalendarCheck, Home, ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";


interface AthleteProfile {
  user_id: string;
  display_name: string;
  athlete_code: string | null;
  age: number | null;
  weight_kg: number | null;
  belt_level: string;
  experience_years: number | null;
  goals: string[] | null;
  tkd_sessions_per_week: number;
  current_injury: string | null;
  program_weeks: number | null;
  weekly_schedule: any;
  avatar_url: string | null;
  discipline: string;
  country: string | null;
  club_id?: string | null;
  club_name?: string | null;
  is_coach?: boolean;
}


interface AthletePlan {
  id: string;
  name: string;
  plan_data: any;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

interface RehabPlan {
  id: string;
  name: string;
  plan_data: any;
  is_active: boolean;
  created_at: string;
  user_id: string;
  injury_description: string;
}


interface DiaryEntry {
  id: string;
  entry_date: string;
  content: string;
  mood: number;
  energy: number;
  tags: string[];
  entry_type?: string | null;
}

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [clubAthletes, setClubAthletes] = useState<AthleteProfile[]>([]);
  const [plans, setPlans] = useState<AthletePlan[]>([]);
  const [rehabPlans, setRehabPlans] = useState<RehabPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulseFilter, setPulseFilter] = useState<PulseFilter>("all");
  const [pulseStats, setPulseStats] = useState({ total: 0, attention: 0, injured: 0, noPlan: 0, stale: 0 });

  const [maxAthletes, setMaxAthletes] = useState(5);
  const [coachUserId, setCoachUserId] = useState<string | null>(null);
  const [coachClubId, setCoachClubId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [superadminActive, setSuperadminActive] = useState(false);
  const [diaryAthleteId, setDiaryAthleteId] = useState<string | null>(null);
  const [diaryAthleteName, setDiaryAthleteName] = useState("");
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [viewPlan, setViewPlan] = useState<AthletePlan | null>(null);
  const [viewRehabPlan, setViewRehabPlan] = useState<RehabPlan | null>(null);
  const [manageAthleteId, setManageAthleteId] = useState<string | null>(null);
  const [coachMentalDue, setCoachMentalDue] = useState(false);
  // Messages/reminders moved to /coach/messages page
  const navigate = useNavigate();
  const { setCoachMode } = useCoachMode();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const { activeClubId, activeMembership, memberships } = useActiveClub();
  const effectiveCoachClubId = activeClubId || coachClubId;
  const { isInTrial, trialDaysLeft, trialExpired } = useClubTrial(effectiveCoachClubId);

  const exitCoachDashboard = () => {
    setCoachMode(false);
    navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    if (!activeMembership) return;
    if (activeMembership.role_in_club !== "coach" && activeMembership.role_in_club !== "admin") {
      setCoachMode(false);
      navigate("/dashboard", { replace: true });
    }
  }, [activeMembership, navigate, setCoachMode]);

  useEffect(() => {
    checkRoleAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Coach mental review is monthly — hide entry card if last one is within 30 days
  useEffect(() => {
    if (!coachUserId) return;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("coach_mental_assessments" as any)
        .select("id")
        .eq("user_id", coachUserId)
        .gte("created_at", since)
        .limit(1);
      setCoachMentalDue(!data || data.length === 0);
    })();
  }, [coachUserId]);

  // Re-run loadAthletes when the active club changes (only matters for multi-club coaches).
  useEffect(() => {
    if (!coachUserId || !activeClubId) return;
    // Skip the very first load — checkRoleAndLoad already triggered it.
    if (activeClubId === coachClubId) return;
    setCoachClubId(activeClubId);
    setLoading(true);
    loadAthletes(coachUserId, activeClubId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClubId]);

  // When superadmin toggles after first mount, refresh squad to pick up cross-club athletes.
  useEffect(() => {
    if (!coachUserId) return;
    loadAthletes(coachUserId, coachClubId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superadminActive]);

  const checkRoleAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    setCoachUserId(user.id);

    const [rolesRes, profileRes] = await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("club_id, onboarding_completed, superadmin_active" as any)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const userRoles = (rolesRes.data || []).map((r: any) => r.role);
    const isCoach = userRoles.some((r: string) => r === "coach" || r === "admin");
    if (!isCoach) { navigate("/dashboard"); return; }
    setIsAdmin(userRoles.includes("admin"));
    setSuperadminActive(Boolean((profileRes.data as any)?.superadmin_active));

    const coachProfile = profileRes.data as any;
    if (!coachProfile?.onboarding_completed) {
      navigate("/onboarding");
      return;
    }
    const coachClubId = coachProfile?.club_id;
    if (!coachClubId) {
      toast({ title: t("completeClubBeforeCoach"), variant: "destructive" });
      navigate("/profile-setup");
      return;
    }
    setCoachClubId(coachClubId);

    // Fetch club's max_athletes limit
    const { data: clubData } = await supabase
      .from("clubs")
      .select("max_athletes")
      .eq("id", coachClubId)
      .single();
    if (clubData?.max_athletes) setMaxAthletes(clubData.max_athletes);

    // Multi-club: prefer the active membership's club. For single-membership coaches
    // activeClubId === coachClubId so behavior is identical.
    const effectiveClubId = activeClubId || coachClubId;
    setCoachClubId(effectiveClubId);
    await loadAthletes(user.id, effectiveClubId);
  };

  const loadAthletes = async (currentUserId?: string, currentClubId?: string) => {
    const userId = currentUserId || coachUserId;
    const clubId = currentClubId || coachClubId;

    const clubsRes = await supabase.from("clubs" as any).select("id, name").order("name");
    const clubMap = new Map<string, string>(
      ((clubsRes.data as unknown as { id: string; name: string }[] | null) ?? []).map((club) => [club.id, club.name])
    );

    if (!clubId || !userId) {
      setAthletes([]);
      setClubAthletes([]);
      setPlans([]);
      setRehabPlans([]);
      setLoading(false);
      return;
    }

    // Squad = ALL active members of the coach's active club (athletes only),
    // sourced from the same secure RPC that already powers the read-only
    // "Club members" section. This makes squad club-membership-driven, not
    // dependent on direct coach_athletes links.
    const { data: clubProfiles } = await supabase
      .rpc("get_club_member_profiles", { _club_id: clubId });

    const allMembers = ((clubProfiles || []) as any[])
      .filter((p) => p.user_id !== userId)
      .map((m) => ({
        ...m,
        club_name: m.club_id ? clubMap.get(m.club_id) || null : null,
        is_coach: !!m.is_coach,
      })) as AthleteProfile[];

    const squadFromClub = allMembers
      .filter((m) => !m.is_coach)
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

    // Squad list always follows the active club. Superadmin gives RLS read
    // access to all clubs via the club switcher — switch club to see another
    // club's athletes; don't merge cross-club links into one list.
    const squad = squadFromClub.sort((a, b) =>
      a.display_name.localeCompare(b.display_name)

    );

    // Avoid duplicates in the read-only "Club members" section:
    // anyone now in the squad is removed from clubAthletes. In practice this
    // means only other coaches remain in that section.
    const squadIdSet = new Set(squad.map((a) => a.user_id));
    const otherMembers = allMembers
      .filter((m) => !squadIdSet.has(m.user_id))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

    setAthletes(squad);
    setClubAthletes(otherMembers);

    const squadIds = squad.map((a) => a.user_id);
    if (squadIds.length === 0) {
      setPlans([]);
      setRehabPlans([]);
    } else {
      const [plansRes, rehabRes] = await Promise.all([
        supabase
          .from("training_plans")
          .select("id, name, plan_data, is_active, created_at, user_id")
          .in("user_id", squadIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("rehab_plans")
          .select("id, name, plan_data, is_active, created_at, user_id, injury_description")
          .in("user_id", squadIds)
          .order("created_at", { ascending: false }),
      ]);
      setPlans((plansRes.data || []) as unknown as AthletePlan[]);
      setRehabPlans((rehabRes.data || []) as unknown as RehabPlan[]);
    }

    setLoading(false);
  };

  const MAX_ATHLETES = maxAthletes;

  // Add/create athlete moved into <CreateAthleteSheet />

  const removeAthlete = async (athleteId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.functions.invoke("reassign-athlete-coach", {
      body: {
        action: "remove_from_club",
        athlete_id: athleteId,
        club_id: effectiveCoachClubId,
      },
    });
    if (error || (data as any)?.error) {
      toast({ title: t("error"), description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: t("athleteRemoved") });
    
    await loadAthletes(user.id, effectiveCoachClubId || undefined);
  };

  const openDiary = async (athleteId: string, athleteName: string) => {
    setDiaryAthleteId(athleteId);
    setDiaryAthleteName(athleteName);
    setDiaryLoading(true);
    setDiaryEntries([]);
    let q: any = supabase
      .from("diary_entries")
      .select("id, entry_date, content, mood, energy, tags, entry_type")
      .eq("user_id", athleteId)
      .order("entry_date", { ascending: false });
    if (activeClubId) q = q.eq("club_id", activeClubId);
    const { data } = await q;
    setDiaryEntries((data as DiaryEntry[]) || []);
    setDiaryLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Watermark />
      <header className="app-header border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-card-foreground truncate">{t("coachDashboard")}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/coach/today")} className="gap-1">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t("todayTab")}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/coach/season-calendar")} className="gap-1">
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">{t("seasonCalendar")}</span>
            </Button>
            
            <LanguageSwitcher />
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 pb-2 flex justify-end">
          <ClubSwitcher />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Trial banner */}
        {isInTrial && trialDaysLeft <= 7 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span>⏰</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {trialDaysLeft === 1
                  ? "1 dag tilbage af din gratis prøveperiode"
                  : `${trialDaysLeft} dage tilbage af din gratis prøveperiode`}
              </span>
            </div>
            <button
              onClick={() => window.location.href = "/priser"}
              className="shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Opgrader →
            </button>
          </div>
        )}

        {trialExpired && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span>🔒</span>
              <span className="text-destructive font-medium">
                Prøveperioden er udløbet — visse funktioner er låst
              </span>
            </div>
            <button
              onClick={() => window.location.href = "/priser"}
              className="shrink-0 text-xs font-semibold text-destructive hover:underline"
            >
              Se prisplaner →
            </button>
          </div>
        )}

        {coachUserId && (
          <div className="space-y-4">



            {/* Action buttons (previously in tab header) */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              
              <Button variant="outline" size="sm" onClick={() => navigate("/coach/consents")}>
                {t("consentsPageTitle")}
              </Button>
              {coachUserId && (
                <AthleteAddMenu
                  coachId={coachUserId}
                  clubId={coachClubId}
                  disabled={!isAdmin && athletes.length >= MAX_ATHLETES}
                  countLabel={!isAdmin ? `${athletes.length}/${MAX_ATHLETES}` : undefined}
                  approvedCount={athletes.length}
                  onCreated={async () => { await loadAthletes(); }}
                />
              )}
            </div>


            {/* Coach mental review entry — only shown when monthly check-in is due */}
            {coachMentalDue && (
              <button
                type="button"
                onClick={() => navigate("/coach/mental")}
                className="w-full text-left rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Mental gennemgang for trænere</p>
                  <p className="text-xs text-muted-foreground">
                    Månedlig check-in på dit indre coachingspil — ikke for atleter, for dig.
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">Start →</span>
              </button>
            )}

            {/* Squad content (formerly the "squad" tab) */}
            <div className="space-y-4">
              {coachUserId && <PendingAthletesSection coachId={coachUserId} />}
              
              {!isAdmin && athletes.length >= MAX_ATHLETES && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-amber-600 dark:text-amber-400 flex-1">
                    Du har nået grænsen på {MAX_ATHLETES} atleter for din klub.
                    Kontakt admin for at udvide din klubkvote.
                  </span>
                  <a
                    href={`mailto:info@sportstalent.dk?subject=${encodeURIComponent(`Udvid klubkvote for ${athletes[0]?.club_name ?? ""}`)}`}
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-amber-500 text-white px-4 py-2 text-sm font-medium hover:bg-amber-600 transition-colors whitespace-nowrap"
                  >
                    Kontakt admin
                  </a>
                </div>
              )}

              {superadminActive && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                  {t("coachSuperadminAllClubs")}
                </div>
              )}

              {athletes.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-bold text-card-foreground mb-1">
                    {memberships && memberships.length > 1
                      ? t("coachNoAthletesInClub")
                      : t("noAthletes")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {memberships && memberships.length > 1
                      ? t("coachSwitchClubHint")
                      : t("noAthletesDesc")}
                  </p>
                </div>
              ) : (
                <>
                  <SquadPulse
                    stats={pulseStats}
                    active={pulseFilter}
                    onChange={setPulseFilter}
                    headerAction={<WeeklySquadExport athletes={athletes as any} variant="inline" />}
                  />
                  <SquadOverview
                    coachId={coachUserId}
                    onSelectAthlete={(id) => navigate(`/coach/athlete/${id}`)}
                    onDiary={(id, name) => openDiary(id, name)}
                    onRemove={(id) => removeAthlete(id)}
                    onViewPlan={(id) => {
                      const p = plans.find((pp) => pp.user_id === id && pp.is_active) || plans.find((pp) => pp.user_id === id);
                      const r = rehabPlans.find((rr) => rr.user_id === id && rr.is_active) || null;
                      if (p) { setViewPlan(p); setViewRehabPlan(r); }
                      else if (r) { setViewRehabPlan(r); }
                    }}
                    allowedUserIds={athletes.map((a) => a.user_id)}
                    removableUserIds={athletes.map((a) => a.user_id)}
                    athleteMeta={athletes.map((a) => ({ user_id: a.user_id, club_name: a.club_name }))}
                    pulseFilter={pulseFilter}
                    onStatsChange={setPulseStats}
                    allClubs={false}
                  />
                </>
              )}

              {coachClubId && <TeamWeeklyScheduleCard clubId={coachClubId} />}
              {coachClubId && <ClubActivityTypesCard clubId={coachClubId} />}

              {/* Club Members (read-only) — split into athletes and coaches, foldable */}
              {clubAthletes.length > 0 && (() => {
                const memberAthletes = clubAthletes.filter((m) => !m.is_coach);
                const memberCoaches = clubAthletes.filter((m) => m.is_coach);
                const renderCard = (a: AthleteProfile, showDiary: boolean) => (
                  <div
                    key={a.user_id}
                    className="rounded-lg border bg-card p-3 border-border/50 overflow-hidden opacity-90"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <AvatarImg avatarUrl={a.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-card-foreground truncate">{a.display_name || t("noName")}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {a.club_name && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Building className="h-2.5 w-2.5" />
                                {a.club_name}
                              </span>
                            )}
                            <p className="text-[10px] text-muted-foreground">{a.athlete_code}</p>
                            {a.belt_level && (
                              <span className="text-[10px] text-muted-foreground capitalize">· {a.belt_level}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant="secondary" className="text-[10px]">{t("readOnly")}</Badge>
                        {showDiary && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("diary")}
                            aria-label={t("diary")}
                            onClick={() => openDiary(a.user_id, a.display_name)}
                          >
                            <NotebookPen className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
                return (
                  <Collapsible defaultOpen className="pt-4 border-t border-border group/clubmembers">
                    <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 text-left">
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Users className="h-4 w-4" /> {t("clubMembers")} ({clubAthletes.length})
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">{t("clubMembersDesc")}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]/clubmembers:-rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-3">
                      {memberAthletes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("athletes")} ({memberAthletes.length})
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {memberAthletes.map((a) => renderCard(a, true))}
                          </div>
                        </div>
                      )}
                      {memberCoaches.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("coaches")} ({memberCoaches.length})
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {memberCoaches.map((a) => renderCard(a, false))}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })()}

            </div>
          </div>
        )}

        {/* Reminder dialog moved to /coach/messages */}

        <Dialog open={!!diaryAthleteId} onOpenChange={(open) => { if (!open) setDiaryAthleteId(null); }}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5" /> {diaryAthleteName} — {t("diary")}
              </DialogTitle>
            </DialogHeader>
            {diaryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <CoachDiaryView entries={diaryEntries as any} />
            )}
          </DialogContent>
        </Dialog>

        {/* Plan View Dialog */}
        <PlanViewDialog
          open={!!viewPlan || !!viewRehabPlan}
          onOpenChange={(open) => { if (!open) { setViewPlan(null); setViewRehabPlan(null); } }}
          plan={viewPlan}
          rehabPlan={viewRehabPlan}
        />

        {/* Athlete management moved to dedicated /coach/athlete/:id page */}
      </main>
      <AppFooter />
    </div>
  );
}
