import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PhysicalTesting } from "@/components/PhysicalTesting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AIPlanCard } from "@/components/AIPlanCard";
import { RehabPlanCard } from "@/components/RehabPlanCard";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { Loader2, Plus, Zap, Heart, Save, Calendar, UserCog, Target, CalendarRange, Brain, Activity as ActivityIcon, ListChecks, Pencil, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SendReminderDialog } from "@/components/SendReminderDialog";
import { ReminderHistory } from "@/components/ReminderHistory";
import { CoachNotes } from "@/components/coach/CoachNotes";
import { CoachAthleteMental } from "@/components/coach/CoachAthleteMental";
import { CoachAthleteReflections } from "@/components/coach/CoachAthleteReflections";
import { PhysicalTestComparison } from "@/components/coach/PhysicalTestComparison";
import { FormCurveChart } from "@/components/FormCurveChart";
import { useNavigate } from "react-router-dom";
import { Video as VideoIcon } from "lucide-react";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia and Herzegovina","Brazil","Brunei","Bulgaria",
  "Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia",
  "Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hungary",
  "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg",
  "Malaysia","Maldives","Mali","Malta","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Myanmar",
  "Nepal","Netherlands","New Zealand","Nigeria","North Korea","North Macedonia","Norway",
  "Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia",
  "Somalia","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Tunisia","Turkey","Turkmenistan",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const GOAL_OPTIONS = [
  "Faster kicks",
  "More explosive footwork",
  "Competition prep",
  "Build lean muscle",
  "Injury prevention",
  "Stronger hips",
  "Improve flexibility",
  "General fitness",
  "Improve balance",
  "Better stance transitions",
  "Movement flow",
];

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

interface CoachAthleteDetailProps {
  athlete: AthleteProfile;
  plans: AthletePlan[];
  rehabPlans: RehabPlan[];
  onRefresh: () => Promise<void>;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday", type: "tkd" },
  { day: "Tuesday", type: "gym" },
  { day: "Wednesday", type: "tkd" },
  { day: "Thursday", type: "gym" },
  { day: "Friday", type: "tkd" },
  { day: "Saturday", type: "gym" },
  { day: "Sunday", type: "rest" },
];

const BELT_LEVELS = ["white", "yellow", "green", "blue", "red", "black"];
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "elite"];

export function CoachAthleteDetail({ athlete, plans, rehabPlans, onRefresh }: CoachAthleteDetailProps) {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [editing, setEditing] = useState(false);
  const [generatingRehab, setGeneratingRehab] = useState(false);
  const [rehabDescription, setRehabDescription] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    (athlete.weekly_schedule as DaySchedule[]) || DEFAULT_SCHEDULE
  );

  // Profile fields
  const [age, setAge] = useState<string>(athlete.age?.toString() || "");
  const [beltLevel, setBeltLevel] = useState(athlete.belt_level || "white");
  const [experienceYears, setExperienceYears] = useState<string>(athlete.experience_years?.toString() || "");
  const [weightKg, setWeightKg] = useState<string>(athlete.weight_kg?.toString() || "");
  const [discipline, setDiscipline] = useState(athlete.discipline || "sparring");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(athlete.goals || []);
  const [programWeeks, setProgramWeeks] = useState(athlete.program_weeks || 8);
  const [country, setCountry] = useState(athlete.country || "");

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const activePlan = plans.find(p => p.is_active);
  const activeRehab = rehabPlans.find(p => p.is_active);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updates: Record<string, any> = {
        belt_level: beltLevel,
        discipline,
        goals: selectedGoals,
        program_weeks: programWeeks,
        country: country || null,
      };
      if (age) updates.age = Math.min(Math.max(parseInt(age), 5), 99);
      if (experienceYears) updates.experience_years = Math.min(Math.max(parseInt(experienceYears), 0), 50);
      if (weightKg) updates.weight_kg = Math.min(Math.max(parseFloat(weightKg), 20), 200);

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", athlete.user_id);
      if (error) throw error;
      toast({ title: t("profileSaved") });
      await onRefresh();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ weekly_schedule: schedule as any })
        .eq("user_id", athlete.user_id);
      if (error) throw error;
      toast({ title: t("profileSaved") });
      await onRefresh();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSavingSchedule(false);
    }
  };

  const generatePlan = async () => {
    setGeneratingPlan(true);
    try {
      const profileWithGoals = { ...athlete, weekly_schedule: schedule, goals: selectedGoals, program_weeks: programWeeks };
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile: profileWithGoals, language: locale },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await supabase
        .from("training_plans")
        .update({ is_active: false })
        .eq("user_id", athlete.user_id);

      const { error: insertError } = await supabase.from("training_plans").insert({
        user_id: athlete.user_id,
        name: data.plan.planName || "Coach Generated Plan",
        plan_data: data.plan,
        is_active: true,
      });
      if (insertError) throw insertError;

      toast({ title: t("planGenerated"), description: `${t("planGeneratedDesc")} - ${athlete.display_name}` });
      await onRefresh();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setGeneratingPlan(false);
    }
  };

  const generateRehabPlan = async () => {
    if (!rehabDescription.trim()) {
      toast({ title: t("error"), description: t("describeInjury"), variant: "destructive" });
      return;
    }
    setGeneratingRehab(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-rehab-plan", {
        body: { injury: rehabDescription, profile: athlete, language: locale },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Deactivate existing rehab plans
      await supabase
        .from("rehab_plans")
        .update({ is_active: false })
        .eq("user_id", athlete.user_id);

      const { error: insertError } = await supabase.from("rehab_plans").insert({
        user_id: athlete.user_id,
        name: data.plan.rehabPlanName || "Coach Rehab Plan",
        plan_data: data.plan,
        injury_description: rehabDescription,
        is_active: true,
      });
      if (insertError) throw insertError;

      toast({ title: t("rehabGenerated") });
      setRehabDescription("");
      await onRefresh();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setGeneratingRehab(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">{athlete.display_name}</h3>
        <SendReminderDialog athleteId={athlete.user_id} athleteName={athlete.display_name} />
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="profile" className="flex flex-col gap-0.5 py-2 px-1 text-[11px] sm:text-xs sm:flex-row sm:gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            <span className="leading-tight">{t("tabProfilePlan")}</span>
          </TabsTrigger>
          <TabsTrigger value="mental" className="flex flex-col gap-0.5 py-2 px-1 text-[11px] sm:text-xs sm:flex-row sm:gap-1.5">
            <Brain className="h-3.5 w-3.5" />
            <span className="leading-tight">{t("tabMental")}</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex flex-col gap-0.5 py-2 px-1 text-[11px] sm:text-xs sm:flex-row sm:gap-1.5">
            <ActivityIcon className="h-3.5 w-3.5" />
            <span className="leading-tight">{t("tabPerformance")}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex flex-col gap-0.5 py-2 px-1 text-[11px] sm:text-xs sm:flex-row sm:gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="leading-tight">{t("tabActivity")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-3">
          {/* Lock / Edit toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              {editing ? (
                <><Pencil className="h-3.5 w-3.5 text-primary" /> {t("editAction")}</>
              ) : (
                <><Lock className="h-3.5 w-3.5" /> {t("readOnly")}</>
              )}
            </span>
            <Button
              size="sm"
              variant={editing ? "default" : "outline"}
              onClick={() => setEditing((v) => !v)}
              aria-label={editing ? t("lockAction") : t("editAction")}
              title={editing ? t("lockAction") : t("editAction")}
            >
              {editing ? <Lock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </div>

          <fieldset disabled={!editing} className="space-y-4 group">
          {/* Athlete Profile */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3 group-disabled:opacity-70">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <UserCog className="h-4 w-4" /> {t("athleteProfile")}
              </h4>
              <Button size="sm" variant="outline" onClick={saveProfile} disabled={!editing || savingProfile}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> {t("save")}</>}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("age")}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="—"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("weightKg")}</Label>
                <Input
                  type="number"
                  min={20}
                  max={200}
                  step={0.1}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="—"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("beltLevel")}</Label>
                <Select value={beltLevel} onValueChange={setBeltLevel} disabled={!editing}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BELT_LEVELS.map((b) => (
                      <SelectItem key={b} value={b}>{t(b)}</SelectItem>
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
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="—"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("discipline")}</Label>
              <Select value={discipline} onValueChange={setDiscipline} disabled={!editing}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sparring">{t("sparring")}</SelectItem>
                  <SelectItem value="poomsae">{t("poomsae")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("country")}</Label>
              <Select value={country} onValueChange={setCountry} disabled={!editing}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={t("chooseCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Weekly Schedule */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3 group-disabled:opacity-70">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {t("weeklySchedule")}
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={saveSchedule}
                disabled={!editing || savingSchedule}
              >
                {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> {t("save")}</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("weeklyScheduleHint")}</p>
            <WeekSchedulePicker schedule={schedule} onChange={setSchedule} />
          </div>

          {/* Training Goals & Plan */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3 group-disabled:opacity-70">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Target className="h-4 w-4" /> {t("trainingGoals")}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">{t("selectAllThatApply")}</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  disabled={!editing}
                  data-active={selectedGoals.includes(goal)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium border border-border transition-colors cursor-pointer
                    data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
                    data-[active=false]:text-muted-foreground hover:text-foreground
                    disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
                >
                  {t(goal)}
                </button>
              ))}
            </div>
          </div>

          {/* Program Length */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3 group-disabled:opacity-70">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {t("programLength")}
            </h4>
            <div className="flex items-center gap-4">
              <Slider
                value={[programWeeks]}
                onValueChange={([v]) => setProgramWeeks(v)}
                min={4}
                max={12}
                step={1}
                disabled={!editing}
                className="flex-1"
              />
              <span className="text-sm font-bold text-foreground min-w-[60px] text-right">{programWeeks} {t("weeks")}</span>
            </div>
          </div>

          {/* Training Plan */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3 group-disabled:opacity-70">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" /> {t("plan")}
              </h4>
              <Button onClick={generatePlan} disabled={!editing || generatingPlan} size="sm">
                {generatingPlan ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
                ) : (
                  <><Plus className="h-4 w-4 mr-1" /> {t("generatePlan")}</>
                )}
              </Button>
            </div>
            {activePlan ? (
              <AIPlanCard plan={activePlan} coachMode athleteUserId={athlete.user_id} />
            ) : (
              <div className="text-center py-6">
                <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noTrainingPlanYet")}</p>
              </div>
            )}
          </div>

          {/* Rehab Plan */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3 group-disabled:opacity-70">
            <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" /> {t("injuryRehabPlan")}
            </h4>
            <p className="text-xs text-muted-foreground">{t("rehabDescription")}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={rehabDescription}
                onChange={(e) => setRehabDescription(e.target.value)}
                placeholder={t("rehabPlaceholder")}
                className="flex-1"
              />
              <Button
                onClick={generateRehabPlan}
                disabled={!editing || generatingRehab || !rehabDescription.trim()}
                size="sm"
                className="w-full sm:w-auto"
              >
                {generatingRehab ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
                ) : (
                  <><Plus className="h-4 w-4 mr-1" /> {t("generateRehabPlan")}</>
                )}
              </Button>
            </div>
            {activeRehab && (
              <RehabPlanCard plan={activeRehab.plan_data} onDelete={async () => {
                await supabase.from("rehab_plans").delete().eq("id", activeRehab.id);
                onRefresh();
              }} />
            )}
          </div>
          </fieldset>
        </TabsContent>

        <TabsContent value="mental" className="space-y-4 mt-3">
          <CoachAthleteMental athleteId={athlete.user_id} />
          <CoachAthleteReflections athleteId={athlete.user_id} athleteName={athlete.display_name} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-3">
          <FormCurveChart userId={athlete.user_id} />
          <PhysicalTestComparison athleteId={athlete.user_id} />
          <PhysicalTesting mode="coach" athleteId={athlete.user_id} athleteName={athlete.display_name} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 mt-3">
          <button
            onClick={() => navigate(`/match-analysis/${athlete.user_id}`)}
            className="w-full rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors p-4 sm:p-5 shadow-card text-left flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <VideoIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{t("matchAnalysisTitle")}</div>
              <div className="text-xs text-muted-foreground truncate">{t("matchAnalysisMetaDesc")}</div>
            </div>
          </button>

          <button
            onClick={() => navigate(`/season?athlete=${athlete.user_id}`)}
            className="w-full rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors p-4 sm:p-5 shadow-card text-left flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <CalendarRange className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground">{t("seasonPlannerTitle")}</div>
              <div className="text-xs text-muted-foreground truncate">{t("hubSeasonDesc")}</div>
            </div>
          </button>

          <CoachNotes athleteId={athlete.user_id} />
          <ReminderHistory athleteId={athlete.user_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
