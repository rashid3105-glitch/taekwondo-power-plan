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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PlanViewDialog } from "@/components/PlanViewDialog";
import { DiaryComments } from "@/components/DiaryComments";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Loader2, UserPlus, Trash2, Zap, Plus, User, Users, NotebookPen, Eye, Heart, UserCog,
  Frown, Meh, Smile, Laugh, BatteryLow, BatteryMedium, BatteryFull,
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
  const [athleteCode, setAthleteCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthleteEmail, setNewAthleteEmail] = useState("");
  const [newAthletePassword, setNewAthletePassword] = useState("");
  const [newAthleteAge, setNewAthleteAge] = useState("");
  const [newAthleteBelt, setNewAthleteBelt] = useState("white");
  const [newAthleteExpYears, setNewAthleteExpYears] = useState("");
  const [newAthleteDiscipline, setNewAthleteDiscipline] = useState("sparring");
  const [creating, setCreating] = useState(false);
  
  const [coachUserId, setCoachUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [diaryAthleteId, setDiaryAthleteId] = useState<string | null>(null);
  const [diaryAthleteName, setDiaryAthleteName] = useState("");
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [viewPlan, setViewPlan] = useState<AthletePlan | null>(null);
  const [viewRehabPlan, setViewRehabPlan] = useState<RehabPlan | null>(null);
  const [manageAthleteId, setManageAthleteId] = useState<string | null>(null);
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

    await loadAthletes(user.id, coachClubId);
  };

  const loadAthletes = async (currentUserId?: string, coachClubId?: string) => {
    const userId = currentUserId || coachUserId;
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

      setAthletes(
        (((profilesRes.data || []) as any[]).map((athlete) => ({
          ...athlete,
          club_name: athlete.club_id ? clubMap.get(athlete.club_id) || null : null,
        })) as AthleteProfile[]).sort((a, b) => a.display_name.localeCompare(b.display_name))
      );
      setPlans((plansRes.data || []) as unknown as AthletePlan[]);
      setRehabPlans((rehabRes.data || []) as unknown as RehabPlan[]);
    }

    // Load club athletes (all profiles in same club, excluding managed athletes and self)
    if (coachClubId && userId) {
      const { data: clubProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, athlete_code, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week, current_injury, program_weeks, weekly_schedule, avatar_url, discipline, club_id, country")
        .eq("club_id", coachClubId)
        .neq("user_id", userId);

      const clubOnly = ((clubProfiles || []) as any[])
        .filter((p) => !athleteIds.includes(p.user_id))
        .map((athlete) => ({
          ...athlete,
          club_name: athlete.club_id ? clubMap.get(athlete.club_id) || null : null,
        })) as AthleteProfile[];

      setClubAthletes(clubOnly.sort((a, b) => a.display_name.localeCompare(b.display_name)));
    }

    setLoading(false);
  };

  const MAX_ATHLETES = 5;

  const addAthlete = async () => {
    if (!athleteCode.trim()) return;
    if (!isAdmin && athletes.length >= MAX_ATHLETES) {
      toast({ title: t("error"), description: t("maxAthletesReached" as any), variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      const { data: userId, error: lookupError } = await supabase
        .rpc("lookup_athlete_by_code", { _code: athleteCode.trim() });

      if (lookupError || !userId) {
        toast({ title: t("error"), description: t("athleteNotFound"), variant: "destructive" });
        setAdding(false);
        return;
      }

      const profile = { user_id: userId };

      const { error } = await supabase
        .from("coach_athletes")
        .insert({ coach_id: (await supabase.auth.getUser()).data.user!.id, athlete_id: profile.user_id });

      if (error) {
        if (error.code === "23505") {
          toast({ title: t("error"), description: t("athleteAlreadyAdded"), variant: "destructive" });
        } else if (error.message?.toLowerCase().includes("row-level security")) {
          toast({ title: t("error"), description: t("sameClubRequired"), variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: t("athleteAdded") });
        setAthleteCode("");
        await loadAthletes();
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };


  const createAthlete = async () => {
    if (!newAthleteName.trim() || !newAthleteEmail.trim() || !newAthletePassword.trim()) return;
    if (!isAdmin && athletes.length >= MAX_ATHLETES) {
      toast({ title: t("error"), description: t("maxAthletesReached" as any), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-athlete", {
        body: {
          name: newAthleteName.trim(),
          email: newAthleteEmail.trim(),
          password: newAthletePassword,
          age: newAthleteAge ? parseInt(newAthleteAge) : null,
          belt_level: newAthleteBelt,
          experience_years: newAthleteExpYears ? parseInt(newAthleteExpYears) : null,
          discipline: newAthleteDiscipline,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: t("athleteCreated"), description: t("athleteCreatedDesc") });
      setNewAthleteName("");
      setNewAthleteEmail("");
      setNewAthletePassword("");
      setNewAthleteAge("");
      setNewAthleteBelt("white");
      setNewAthleteExpYears("");
      setNewAthleteDiscipline("sparring");
      await loadAthletes();
    } catch (err: any) {
      const description = err.message === "COACH_CLUB_REQUIRED" ? t("completeClubBeforeCoach") : err.message;
      toast({ title: t("error"), description, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
        {/* Athlete limit warning */}
        {!isAdmin && athletes.length >= MAX_ATHLETES && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm text-destructive flex-1">{t("maxAthletesReached" as any)}</span>
            <a href="mailto:info@sportstalent.dk?subject=Upgrade%20to%20Enterprise" className="inline-flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
              {t("upgradeEnterprise" as any)}
            </a>
          </div>
        )}

        {/* Create athlete */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {t("createAthlete")} {!isAdmin && <>({athletes.length}/{MAX_ATHLETES})</>}
          </h3>
          <p className="text-xs text-muted-foreground">{t("createAthleteDesc")}</p>
          <p className="text-xs text-muted-foreground">{t("athleteInheritsCoachClub")}</p>

          {showCreateForm ? (
            <div className="space-y-3">
              <Input
                value={newAthleteName}
                onChange={(e) => setNewAthleteName(e.target.value)}
                placeholder={t("athleteName")}
              />
              <Input
                type="email"
                value={newAthleteEmail}
                onChange={(e) => setNewAthleteEmail(e.target.value)}
                placeholder={t("athleteEmail")}
              />
              <Input
                type="password"
                value={newAthletePassword}
                onChange={(e) => setNewAthletePassword(e.target.value)}
                placeholder={t("athletePassword")}
                minLength={6}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{t("age")}</Label>
                  <Input
                    type="number"
                    min={5}
                    max={99}
                    value={newAthleteAge}
                    onChange={(e) => setNewAthleteAge(e.target.value)}
                    placeholder="—"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("beltLevel")}</Label>
                  <Select value={newAthleteBelt} onValueChange={setNewAthleteBelt}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["white", "yellow", "green", "blue", "red", "black"].map((b) => (
                        <SelectItem key={b} value={b}>{t(b as any)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("yearsOfExperience")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={newAthleteExpYears}
                    onChange={(e) => setNewAthleteExpYears(e.target.value)}
                    placeholder="—"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("discipline")}</Label>
                <Select value={newAthleteDiscipline} onValueChange={setNewAthleteDiscipline}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sparring">{t("sparring")}</SelectItem>
                    <SelectItem value="poomsae">{t("poomsae")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={createAthlete} disabled={creating || !newAthleteName.trim() || !newAthleteEmail.trim() || !newAthletePassword.trim() || (!isAdmin && athletes.length >= MAX_ATHLETES)} size="sm">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> {t("createAccount")}</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCreateForm(true)} size="sm" className="w-full sm:w-auto" disabled={!isAdmin && athletes.length >= MAX_ATHLETES}>
              <Plus className="h-4 w-4 mr-1" /> {t("createAthlete")}
            </Button>
          )}

          {/* Or add by code */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">{t("orAddByCode")}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={athleteCode}
                onChange={(e) => setAthleteCode(e.target.value)}
                placeholder={t("athleteCodePlaceholder")}
                className="flex-1 uppercase"
              />
              <Button onClick={addAthlete} disabled={adding || !athleteCode.trim() || (!isAdmin && athletes.length >= MAX_ATHLETES)} size="sm" variant="outline" className="w-full sm:w-auto">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> {t("add")}</>}
              </Button>
            </div>
          </div>
        </div>


        {/* Athlete list */}
        {athletes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">{t("noAthletes")}</h3>
            <p className="text-sm text-muted-foreground">{t("noAthletesDesc")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("myAthletes")} ({athletes.length})
            </h3>
            <div className="grid gap-3">
              {athletes.map((a) => {
                const athletePlans = plans.filter(p => p.user_id === a.user_id);
                const athleteRehabs = rehabPlans.filter(r => r.user_id === a.user_id);
                return (
                  <div
                    key={a.user_id}
                    className="rounded-lg border bg-card p-3 sm:p-4 transition-colors border-border hover:border-muted-foreground/30 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                        {a.avatar_url ? (
                          <img src={a.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">{a.display_name || t("noName")}</p>
                          {a.club_name && <p className="text-[10px] text-muted-foreground">{t("club")}: {a.club_name}</p>}
                          <p className="text-[10px] text-muted-foreground">{a.athlete_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); setManageAthleteId(a.user_id); }}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">{t("manageAthlete" as any)}</TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={t("diary" as any)}
                          onClick={(e) => { e.stopPropagation(); openDiary(a.user_id, a.display_name); }}
                        >
                          <NotebookPen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeAthlete(a.user_id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {a.belt_level && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                          {a.belt_level} {t("belt")}
                        </span>
                      )}
                      {a.age && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.age}y</span>
                      )}
                      {a.weight_kg && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.weight_kg}kg</span>
                      )}
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {a.tkd_sessions_per_week}x {t("tkdPerWeek")}
                      </span>
                      {a.current_injury && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                          ⚠ {a.current_injury}
                        </span>
                      )}
                    </div>
                    {a.goals && a.goals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {a.goals.map((g) => (
                          <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {t(g as any) || g}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Plan rows with eye button */}
                    {athletePlans.length > 0 && (
                      <div className="mt-2.5 space-y-1 border-t border-border pt-2">
                        {athletePlans.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-xs">
                            <Zap className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 truncate text-muted-foreground">
                              {p.name}
                            </span>
                            {p.is_active && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                Active
                              </span>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const athleteActiveRehab = athleteRehabs.find(r => r.is_active);
                                    setViewPlan(p);
                                    setViewRehabPlan(athleteActiveRehab || null);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">View full plan</TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Rehab plan rows */}
                    {athleteRehabs.length > 0 && (
                      <div className={cn("space-y-1", athletePlans.length === 0 ? "mt-2.5 border-t border-border pt-2" : "")}>
                        {athleteRehabs.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 text-xs">
                            <Heart className="h-3 w-3 text-destructive flex-shrink-0" />
                            <span className="flex-1 truncate text-muted-foreground">
                              {r.name}
                            </span>
                            {r.is_active && (
                              <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
                                Active
                              </span>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewPlan(null);
                                    setViewRehabPlan(r);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">View rehab plan</TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Club Athletes (read-only) */}
        {clubAthletes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> {t("clubAthletes" as any)} ({clubAthletes.length})
            </h3>
            <p className="text-xs text-muted-foreground">{t("clubAthletesDesc" as any)}</p>
            <div className="grid gap-3">
              {clubAthletes.map((a) => (
                <div
                  key={a.user_id}
                  className="rounded-lg border bg-card p-3 sm:p-4 border-border/50 overflow-hidden opacity-90"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {a.avatar_url ? (
                        <img src={a.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{a.display_name || t("noName")}</p>
                        <p className="text-[10px] text-muted-foreground">{a.athlete_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{t("readOnly" as any)}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={t("diary" as any)}
                        onClick={() => openDiary(a.user_id, a.display_name)}
                      >
                        <NotebookPen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {a.belt_level && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">
                        {a.belt_level} {t("belt")}
                      </span>
                    )}
                    {a.age && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.age}y</span>
                    )}
                    {a.weight_kg && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.weight_kg}kg</span>
                    )}
                  </div>
                  {a.goals && a.goals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {a.goals.map((g) => (
                        <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t(g as any) || g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}


        <Dialog open={!!diaryAthleteId} onOpenChange={(open) => { if (!open) setDiaryAthleteId(null); }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5" /> {diaryAthleteName} — {t("diary" as any)}
              </DialogTitle>
            </DialogHeader>
            {diaryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : diaryEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("diaryEmpty" as any)}</p>
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
