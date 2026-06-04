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
import { CoachAthleteDetail } from "@/components/CoachAthleteDetail";
import { AvatarImg } from "@/components/AvatarImg";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PlanViewDialog } from "@/components/PlanViewDialog";
import { DiaryComments } from "@/components/DiaryComments";
import { CoachDiaryView } from "@/components/coach/CoachDiaryView";
import { SquadOverview } from "@/components/coach/SquadOverview";
import { SquadPulse, type PulseFilter } from "@/components/coach/SquadPulse";
import { SessionAttendance } from "@/components/coach/SessionAttendance";
import { WeeklySquadExport } from "@/components/coach/WeeklySquadExport";
import { CoachSentHistory } from "@/components/coach/CoachSentHistory";
import { CreateAthleteDialog } from "@/components/coach/CreateAthleteDialog";
import { InviteDialog } from "@/components/coach/InviteDialog";
import { PendingAthletesSection } from "@/components/coach/PendingAthletesSection";
import { CoachBulkCreateCompetitionDialog } from "@/components/coach/CoachBulkCreateCompetitionDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Loader2, Zap, User, Users, NotebookPen, UserCog,
  Frown, Meh, Smile, Laugh, BatteryLow, BatteryMedium, BatteryFull, MessageSquare, Bell, Search, Send, Building, CalendarRange, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MessagesIcon } from "@/components/chat/MessagesIcon";

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

const MOOD_ICONS = [Frown, Frown, Meh, Smile, Laugh];
const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
const MOOD_COLORS = ["text-destructive", "text-orange-400", "text-yellow-400", "text-emerald-400", "text-emerald-500"];
const ENERGY_ICONS = [BatteryLow, BatteryLow, BatteryMedium, BatteryFull, BatteryFull];
const ENERGY_LABELS = ["Drained", "Low", "Moderate", "High", "Peak"];

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
  const [diaryAthleteId, setDiaryAthleteId] = useState<string | null>(null);
  const [diaryAthleteName, setDiaryAthleteName] = useState("");
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [viewPlan, setViewPlan] = useState<AthletePlan | null>(null);
  const [viewRehabPlan, setViewRehabPlan] = useState<RehabPlan | null>(null);
  const [manageAthleteId, setManageAthleteId] = useState<string | null>(null);
  // Messages tab state
  const [messageRecipientIds, setMessageRecipientIds] = useState<Set<string>>(new Set());
  const [messageSearch, setMessageSearch] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const toggleRecipient = (id: string) => {
    setMessageRecipientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const navigate = useNavigate();
  const { setCoachMode } = useCoachMode();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const { activeClubId, activeMembership, memberships } = useActiveClub();

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
        .select("club_id, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const userRoles = (rolesRes.data || []).map((r: any) => r.role);
    const isCoach = userRoles.some((r: string) => r === "coach" || r === "admin");
    if (!isCoach) { navigate("/dashboard"); return; }
    setIsAdmin(userRoles.includes("admin"));

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
    const { data: links } = await supabase
      .from("coach_athletes")
      .select("athlete_id");

    const athleteIds = (links || []).map((l: any) => l.athlete_id);

    const clubsRes = await supabase.from("clubs" as any).select("id, name").order("name");
    const clubMap = new Map<string, string>(
      ((clubsRes.data as unknown as { id: string; name: string }[] | null) ?? []).map((club) => [club.id, club.name])
    );

    // Membership-based filter: athletes whose active membership puts them in this club.
    // For a coach in only one club this is identical to the old `athlete.club_id === clubId` filter
    // because club_memberships was backfilled from profiles.club_id.
    let clubMembershipIds = new Set<string>();
    if (clubId) {
      const { data: memberRows } = await supabase
        .from("club_memberships" as any)
        .select("user_id")
        .eq("club_id", clubId)
        .eq("status", "active");
      clubMembershipIds = new Set(((memberRows as any[]) ?? []).map((r) => r.user_id as string));
    }

    if (athleteIds.length === 0) {
      setAthletes([]);
      setPlans([]);
      setRehabPlans([]);
    } else {
      const [profilesRes, plansRes, rehabRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, athlete_code, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week, current_injury, program_weeks, weekly_schedule, avatar_url, discipline, club_id, country")
          .in("user_id", athleteIds),
        supabase
          .from("training_plans")
          .select("id, name, plan_data, is_active, created_at, user_id")
          .in("user_id", athleteIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("rehab_plans")
          .select("id, name, plan_data, is_active, created_at, user_id, injury_description")
          .in("user_id", athleteIds)
          .order("created_at", { ascending: false }),
      ]);

      // Restrict managed athletes to those who hold an active membership in this club.
      const sameClubProfiles = (((profilesRes.data || []) as any[])
        .filter((athlete) => clubId && (clubMembershipIds.has(athlete.user_id) || athlete.club_id === clubId))
        .map((athlete) => ({
          ...athlete,
          club_name: athlete.club_id ? clubMap.get(athlete.club_id) || null : null,
        })) as AthleteProfile[]).sort((a, b) => a.display_name.localeCompare(b.display_name));

      const sameClubIds = new Set(sameClubProfiles.map((a) => a.user_id));

      setAthletes(sameClubProfiles);
      setPlans(((plansRes.data || []) as unknown as AthletePlan[]).filter((p) => sameClubIds.has(p.user_id)));
      setRehabPlans(((rehabRes.data || []) as unknown as RehabPlan[]).filter((r) => sameClubIds.has(r.user_id)));
    }

    // Load club athletes via secure RPC (excludes sensitive financial fields)
    if (clubId && userId) {
      const { data: clubProfiles } = await supabase
        .rpc("get_club_member_profiles", { _club_id: clubId });

      const clubOnly = ((clubProfiles || []) as any[])
        .filter((p) => p.user_id !== userId && !athleteIds.includes(p.user_id))
        .map((athlete) => ({
          ...athlete,
          club_name: athlete.club_id ? clubMap.get(athlete.club_id) || null : null,
        })) as AthleteProfile[];

      setClubAthletes(clubOnly.sort((a, b) => a.display_name.localeCompare(b.display_name)));
    }

    setLoading(false);
  };

  const MAX_ATHLETES = maxAthletes;

  // Add/create athlete moved into <CreateAthleteSheet />

  const removeAthlete = async (athleteId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("coach_athletes").delete().eq("coach_id", user.id).eq("athlete_id", athleteId);
    toast({ title: t("athleteRemoved") });
    
    await loadAthletes();
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={exitCoachDashboard}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-foreground truncate">{t("coachDashboard")}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/coach/season-calendar")} className="gap-1">
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">{t("seasonCalendar")}</span>
            </Button>
            <MessagesIcon isCoach />
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={exitCoachDashboard}
              aria-label="Home"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 pb-2 flex justify-end">
          <ClubSwitcher />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {coachUserId && (
          <Tabs defaultValue="today" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none w-full sm:w-auto">
                <TabsList className="w-max">
                  <TabsTrigger value="today">{t("todayTab")}</TabsTrigger>
                  <TabsTrigger value="squad">{t("squadTab")}</TabsTrigger>
                  <TabsTrigger value="messages">{t("messagesTab")}</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <WeeklySquadExport athletes={athletes as any} />
                <CoachBulkCreateCompetitionDialog
                  athletes={athletes.map((a) => ({
                    user_id: a.user_id,
                    display_name: a.display_name,
                    weight_kg: a.weight_kg,
                    avatar_url: a.avatar_url,
                  }))}
                  onCreated={async () => { await loadAthletes(); }}
                />
                <CreateAthleteDialog
                  disabled={!isAdmin && athletes.length >= MAX_ATHLETES}
                  onCreated={async () => { await loadAthletes(); }}
                  countLabel={!isAdmin ? `${athletes.length}/${MAX_ATHLETES}` : undefined}
                />
                {coachUserId && (
                  <InviteDialog
                    coachId={coachUserId}
                    clubId={coachClubId}
                    pendingCount={0}
                    approvedCount={athletes.length}
                  />
                )}
              </div>
            </div>

            <TabsContent value="squad" className="space-y-4">
              {coachUserId && <PendingAthletesSection coachId={coachUserId} />}
              {!isAdmin && athletes.length >= MAX_ATHLETES && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-destructive flex-1">{t("maxAthletesReached")}</span>
                  <a href="mailto:info@sportstalent.dk?subject=Upgrade%20to%20Enterprise" className="inline-flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
                    {t("upgradeEnterprise")}
                  </a>
                </div>
              )}

              {athletes.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
                  <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-1">{t("noAthletes")}</h3>
                  <p className="text-sm text-muted-foreground">{t("noAthletesDesc")}</p>
                </div>
              ) : (
                <>
                  <SquadPulse
                    stats={pulseStats}
                    active={pulseFilter}
                    onChange={setPulseFilter}
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
                    athleteMeta={athletes.map((a) => ({ user_id: a.user_id, club_name: a.club_name }))}
                    pulseFilter={pulseFilter}
                    onStatsChange={setPulseStats}
                  />
                </>
              )}

              {/* Club Athletes (read-only) */}
              {clubAthletes.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4" /> {t("clubAthletes")} ({clubAthletes.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("clubAthletesDesc")}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {clubAthletes.map((a) => (
                      <div
                        key={a.user_id}
                        className="rounded-lg border bg-card p-3 border-border/50 overflow-hidden opacity-90"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <AvatarImg avatarUrl={a.avatar_url} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-foreground truncate">{a.display_name || t("noName")}</p>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={t("diary")}
                              onClick={() => openDiary(a.user_id, a.display_name)}
                            >
                              <NotebookPen className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="today" className="space-y-4">
              <SessionAttendance coachId={coachUserId} athletes={athletes.map((a) => ({ user_id: a.user_id, display_name: a.display_name, avatar_url: a.avatar_url }))} />
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              {athletes.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-bold text-foreground mb-1">{t("messagesTab")}</h3>
                  <p className="text-sm text-muted-foreground">{t("messagesNoAthletes")}</p>
                </div>
              ) : (
                <>
                  {/* Header card */}
                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-1">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" /> {t("messagesTab")}
                    </h3>
                    <p className="text-xs text-muted-foreground">{t("messagesTabDescription")}</p>
                  </div>

                  {/* Recipient picker */}
                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{t("recipientsLabel")}</h4>
                      <span className="text-xs text-muted-foreground">
                        {t("selectedCount")
                          .replace("{n}", String(messageRecipientIds.size))
                          .replace("{total}", String(athletes.length))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={messageSearch}
                          onChange={(e) => setMessageSearch(e.target.value)}
                          placeholder={t("searchAthletes")}
                          className="pl-8 h-9"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs whitespace-nowrap"
                        onClick={() => {
                          if (messageRecipientIds.size === athletes.length) {
                            setMessageRecipientIds(new Set());
                          } else {
                            setMessageRecipientIds(new Set(athletes.map((a) => a.user_id)));
                          }
                        }}
                      >
                        {messageRecipientIds.size === athletes.length ? t("clearSelection") : t("selectAll")}
                      </Button>
                    </div>
                    <div className="max-h-72 overflow-y-auto rounded-md border border-border divide-y divide-border">
                      {athletes
                        .filter((a) =>
                          !messageSearch.trim()
                            ? true
                            : (a.display_name || "").toLowerCase().includes(messageSearch.toLowerCase())
                        )
                        .map((a) => {
                          const checked = messageRecipientIds.has(a.user_id);
                          return (
                            <label
                              key={a.user_id}
                              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleRecipient(a.user_id)}
                              />
                              <AvatarImg avatarUrl={a.avatar_url} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {a.display_name || t("noName")}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {a.club_name && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                      <Building className="h-2.5 w-2.5" />
                                      {a.club_name}
                                    </span>
                                  )}
                                  <p className="text-[10px] text-muted-foreground truncate">{a.athlete_code}</p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>

                  {/* Composer card */}
                  {messageRecipientIds.size > 0 && (
                    <div className="rounded-xl border-2 border-primary/40 bg-card p-4 sm:p-5 shadow-card space-y-3 animate-fade-in">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" /> {t("composerTitle")}
                      </h4>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("messageSubjectLabel")}</Label>
                        <Input
                          value={messageSubject}
                          onChange={(e) => setMessageSubject(e.target.value)}
                          maxLength={200}
                          placeholder={t("messageSubjectPlaceholder")}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t("messageBodyLabel")}</Label>
                        <Textarea
                          value={messageBody}
                          onChange={(e) => setMessageBody(e.target.value)}
                          rows={5}
                          maxLength={5000}
                          placeholder={t("messageBodyPlaceholder")}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={async () => {
                            if (!messageSubject.trim()) {
                              toast({ title: t("error"), description: t("messageSubjectRequired"), variant: "destructive" });
                              return;
                            }
                            const recipients = athletes.filter((a) => messageRecipientIds.has(a.user_id));
                            if (recipients.length === 0) return;
                            setSendingMessage(true);
                            try {
                              const { data, error } = await supabase.functions.invoke("send-coach-message", {
                                body: {
                                  athleteIds: recipients.map((a) => a.user_id),
                                  subject: messageSubject.trim(),
                                  body: messageBody.trim(),
                                },
                              });
                              if (error || (data as any)?.error) {
                                throw new Error(error?.message || (data as any)?.error);
                              }
                              toast({
                                title: t("messageSent"),
                                description: `${(data as any)?.inserted || 0} ${t("delivered")} · ${(data as any)?.emailed || 0} ${t("emailed")}`,
                              });
                              setMessageSubject("");
                              setMessageBody("");
                              setMessageRecipientIds(new Set());
                            } catch (err: any) {
                              toast({ title: t("error"), description: err.message, variant: "destructive" });
                            } finally {
                              setSendingMessage(false);
                            }
                          }}
                          disabled={sendingMessage}
                          className="flex-1"
                        >
                          {sendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" /> {t("bulkSendMessage")}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setReminderOpen(true)}
                          disabled={sendingMessage}
                          className="flex-1"
                        >
                          <Bell className="h-4 w-4 mr-1" /> {t("sendReminderInstead")}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{t("messageDeliveryNote")}</p>
                    </div>
                  )}

                  {/* Sent history (messages + reminders) */}
                  <CoachSentHistory
                    coachId={coachUserId}
                    athleteNames={Object.fromEntries(
                      [...athletes, ...clubAthletes].map((a) => [a.user_id, a.display_name])
                    )}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Reminder dialog (used from Messages tab) */}
        <Dialog open={reminderOpen} onOpenChange={(v) => !sendingReminder && setReminderOpen(v)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> {t("bulkSendReminder")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("sendingTo")} {messageRecipientIds.size} {t("athletes")}
              </p>
              <div className="space-y-1">
                <Label className="text-xs">{t("reminderTitleLabel")}</Label>
                <Input value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("eventDateLabel")}</Label>
                <Input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("reminderMessageLabel")}</Label>
                <Textarea value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} rows={3} maxLength={1000} />
              </div>
              <Button
                onClick={async () => {
                  if (!reminderTitle.trim() || !reminderDate) {
                    toast({ title: t("error"), description: t("reminderTitleRequired"), variant: "destructive" });
                    return;
                  }
                  const recipients = athletes.filter((a) => messageRecipientIds.has(a.user_id));
                  if (recipients.length === 0) return;
                  setSendingReminder(true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Not authenticated");
                    const rows = recipients.map((a) => ({
                      coach_id: user.id,
                      athlete_id: a.user_id,
                      title: reminderTitle.trim(),
                      event_date: reminderDate,
                      message: reminderMessage.trim(),
                      ...(activeClubId ? { club_id: activeClubId } : {}),
                    }));
                    const { data: insertedRows, error } = await supabase
                      .from("event_reminders")
                      .insert(rows)
                      .select("id");
                    if (error) throw error;
                    const reminderIds = (insertedRows || []).map((r: any) => r.id);
                    if (reminderIds.length > 0) {
                      try {
                        await supabase.functions.invoke("send-coach-message", {
                          body: { reminderIds },
                        });
                      } catch (e) {
                        console.warn("Email fan-out failed", e);
                      }
                    }
                    toast({ title: t("reminderSent"), description: `${recipients.length} ${t("athletes")}` });
                    setReminderOpen(false);
                    setReminderTitle("");
                    setReminderDate("");
                    setReminderMessage("");
                    setMessageRecipientIds(new Set());
                  } catch (err: any) {
                    toast({ title: t("error"), description: err.message, variant: "destructive" });
                  } finally {
                    setSendingReminder(false);
                  }
                }}
                disabled={sendingReminder}
                className="w-full"
              >
                {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : t("send")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
