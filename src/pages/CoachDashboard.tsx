import { useEffect, useState } from "react";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CoachAthleteDetail } from "@/components/CoachAthleteDetail";
import { AvatarImg } from "@/components/AvatarImg";
import { validatePassword } from "@/lib/passwordValidation";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PlanViewDialog } from "@/components/PlanViewDialog";
import { DiaryComments } from "@/components/DiaryComments";
import { SquadOverview } from "@/components/coach/SquadOverview";
import { SquadPulse, type PulseFilter } from "@/components/coach/SquadPulse";
import { SessionAttendance } from "@/components/coach/SessionAttendance";
import { WeeklySquadExport } from "@/components/coach/WeeklySquadExport";
import { CoachSentHistory } from "@/components/coach/CoachSentHistory";
import { CreateAthleteSheet } from "@/components/coach/CreateAthleteSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Loader2, Zap, User, Users, NotebookPen, UserCog,
  Frown, Meh, Smile, Laugh, BatteryLow, BatteryMedium, BatteryFull, MessageSquare, Bell, Search, Send, Building,
} from "lucide-react";
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
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    checkRoleAndLoad();
  }, []);

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
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const userRoles = (rolesRes.data || []).map((r: any) => r.role);
    const isCoach = userRoles.some((r: string) => r === "coach" || r === "admin");
    if (!isCoach) { navigate("/dashboard"); return; }
    setIsAdmin(userRoles.includes("admin"));

    const coachClubId = (profileRes.data as any)?.club_id;
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

    await loadAthletes(user.id, coachClubId);
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

      // Restrict managed athletes to those sharing the coach's club
      const sameClubProfiles = (((profilesRes.data || []) as any[])
        .filter((athlete) => clubId && athlete.club_id === clubId)
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
    const { data } = await supabase
      .from("diary_entries")
      .select("id, entry_date, content, mood, energy, tags")
      .eq("user_id", athleteId)
      .order("entry_date", { ascending: false });
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-foreground">{t("coachDashboard")}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {coachUserId && (
          <Tabs defaultValue="squad" className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none w-full sm:w-auto">
                <TabsList className="w-max">
                  <TabsTrigger value="squad">{t("squadTab")}</TabsTrigger>
                  <TabsTrigger value="today">{t("todayTab")}</TabsTrigger>
                  <TabsTrigger value="messages">{t("messagesTab")}</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex items-center gap-2">
                <WeeklySquadExport athletes={athletes as any} />
                <CreateAthleteSheet
                  disabled={!isAdmin && athletes.length >= MAX_ATHLETES}
                  onCreated={async () => { await loadAthletes(); }}
                  countLabel={!isAdmin ? `${athletes.length}/${MAX_ATHLETES}` : undefined}
                />
              </div>
            </div>

            <TabsContent value="squad" className="space-y-4">
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
                    onSelectAthlete={(id) => setManageAthleteId(id)}
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



        <Dialog open={!!diaryAthleteId} onOpenChange={(open) => { if (!open) setDiaryAthleteId(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5" /> {diaryAthleteName} — {t("diary")}
              </DialogTitle>
            </DialogHeader>
            {diaryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : diaryEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("diaryEmpty")}</p>
            ) : (
              <div className="space-y-3">
                {diaryEntries.map((entry) => {
                  const EntryMood = MOOD_ICONS[(entry.mood || 3) - 1] || Meh;
                  const EntryEnergy = ENERGY_ICONS[(entry.energy || 3) - 1] || BatteryMedium;
                  return (
                    <div key={entry.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground">
                          {new Date(entry.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                            weekday: "short", day: "numeric", month: "short",
                          })}
                        </span>
                        <span className={MOOD_COLORS[(entry.mood || 3) - 1]} title={MOOD_LABELS[(entry.mood || 3) - 1]}>
                          <EntryMood className="h-4 w-4" />
                        </span>
                        <span className="text-primary" title={ENERGY_LABELS[(entry.energy || 3) - 1]}>
                          <EntryEnergy className="h-4 w-4" />
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <DiaryComments entryId={entry.id} canComment={true} />
                    </div>
                  );
                })}
              </div>
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

        {/* Manage Athlete Dialog/Drawer */}
        {(() => {
          const managedAthlete = manageAthleteId ? athletes.find(a => a.user_id === manageAthleteId) : null;
          const athletePlans = managedAthlete ? plans.filter(p => p.user_id === managedAthlete.user_id) : [];
          const athleteRehabs = managedAthlete ? rehabPlans.filter(r => r.user_id === managedAthlete.user_id) : [];
          const isOpen = !!managedAthlete;
          const onClose = () => setManageAthleteId(null);

          const content = managedAthlete ? (
            <CoachAthleteDetail
              athlete={managedAthlete as any}
              plans={athletePlans}
              rehabPlans={athleteRehabs}
              onRefresh={async () => { await loadAthletes(); }}
            />
          ) : null;

          if (isMobile) {
            return (
              <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DrawerContent className="max-h-[90vh]">
                  <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2">
                      <UserCog className="h-5 w-5" /> {managedAthlete?.display_name}
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 overflow-y-auto max-h-[75vh]">
                    {content}
                  </div>
                </DrawerContent>
              </Drawer>
            );
          }

          return (
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" /> {managedAthlete?.display_name}
                  </DialogTitle>
                </DialogHeader>
                {content}
              </DialogContent>
            </Dialog>
          );
        })()}
      </main>
      <AppFooter />
    </div>
  );
}
