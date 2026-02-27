import { useEffect, useState } from "react";
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
import {
  ArrowLeft, Loader2, UserPlus, Trash2, Zap, Plus, User,
} from "lucide-react";

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

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
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
  const [creating, setCreating] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  useEffect(() => {
    checkRoleAndLoad();
  }, []);

  const checkRoleAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isCoach = (roles || []).some((r: any) => r.role === "coach" || r.role === "admin");
    if (!isCoach) { navigate("/dashboard"); return; }

    await loadAthletes();
  };

  const loadAthletes = async () => {
    const { data: links } = await supabase
      .from("coach_athletes")
      .select("athlete_id");

    if (!links || links.length === 0) {
      setAthletes([]);
      setPlans([]);
      setRehabPlans([]);
      setLoading(false);
      return;
    }

    const athleteIds = links.map((l: any) => l.athlete_id);

    const [profilesRes, plansRes, rehabRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, athlete_code, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week, current_injury, program_weeks, weekly_schedule, avatar_url")
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

    setAthletes((profilesRes.data || []) as unknown as AthleteProfile[]);
    setPlans((plansRes.data || []) as unknown as AthletePlan[]);
    setRehabPlans((rehabRes.data || []) as unknown as RehabPlan[]);
    setLoading(false);
  };

  const addAthlete = async () => {
    if (!athleteCode.trim()) return;
    setAdding(true);
    try {
      // Look up athlete by code using the edge function (since coach may not have direct profile access yet)
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("athlete_code", athleteCode.trim().toUpperCase())
        .maybeSingle();

      if (!profile) {
        toast({ title: t("error"), description: t("athleteNotFound"), variant: "destructive" });
        setAdding(false);
        return;
      }

      const { error } = await supabase
        .from("coach_athletes")
        .insert({ coach_id: (await supabase.auth.getUser()).data.user!.id, athlete_id: profile.user_id });

      if (error) {
        if (error.code === "23505") {
          toast({ title: t("error"), description: t("athleteAlreadyAdded"), variant: "destructive" });
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
      setShowCreateForm(false);
      await loadAthletes();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const removeAthlete = async (athleteId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("coach_athletes").delete().eq("coach_id", user.id).eq("athlete_id", athleteId);
    toast({ title: t("athleteRemoved") });
    if (selectedAthlete === athleteId) setSelectedAthlete(null);
    await loadAthletes();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedAthleteProfile = athletes.find(a => a.user_id === selectedAthlete);
  const selectedAthletePlans = plans.filter(p => p.user_id === selectedAthlete);
  const selectedAthleteRehabs = rehabPlans.filter(p => p.user_id === selectedAthlete);

  return (
    <div className="min-h-screen bg-background">
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
        {/* Create athlete */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> {t("createAthlete")}
          </h3>
          <p className="text-xs text-muted-foreground">{t("createAthleteDesc")}</p>

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
              <div className="flex gap-2">
                <Button onClick={createAthlete} disabled={creating || !newAthleteName.trim() || !newAthleteEmail.trim() || !newAthletePassword.trim()} size="sm">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> {t("createAccount")}</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowCreateForm(true)} size="sm" className="w-full sm:w-auto">
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
              <Button onClick={addAthlete} disabled={adding || !athleteCode.trim()} size="sm" variant="outline" className="w-full sm:w-auto">
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
                const hasActivePlan = plans.some(p => p.user_id === a.user_id && p.is_active);
                return (
                  <div
                    key={a.user_id}
                    className={`rounded-lg border bg-card p-4 cursor-pointer transition-colors ${
                      selectedAthlete === a.user_id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setSelectedAthlete(selectedAthlete === a.user_id ? null : a.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {a.avatar_url ? (
                          <img src={a.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-border" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-foreground">{a.display_name || t("noName")}</p>
                          <p className="text-[10px] text-muted-foreground">{a.athlete_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasActivePlan && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("hasPlan")}</span>
                        )}
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected athlete detail */}
        {selectedAthleteProfile && (
          <CoachAthleteDetail
            athlete={selectedAthleteProfile}
            plans={selectedAthletePlans}
            rehabPlans={selectedAthleteRehabs}
            onRefresh={loadAthletes}
          />
        )}
      </main>
    </div>
  );
}
