import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AIPlanCard } from "@/components/AIPlanCard";
import { RehabPlanCard } from "@/components/RehabPlanCard";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { Loader2, Plus, Zap, Heart, Save, Calendar, UserCog, Target } from "lucide-react";

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
  const [generatingPlan, setGeneratingPlan] = useState(false);
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
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile: { ...athlete, weekly_schedule: schedule }, language: locale },
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
      <h3 className="font-bold text-foreground">{athlete.display_name}</h3>

      {/* Athlete Profile */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <UserCog className="h-4 w-4" /> {t("athleteProfile")}
          </h4>
          <Button size="sm" variant="outline" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> {t("save")}</>}
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("age")}</Label>
            <Input
              type="number"
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
            <Select value={beltLevel} onValueChange={setBeltLevel}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BELT_LEVELS.map((b) => (
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
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              placeholder="—"
              className="h-9"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("discipline")}</Label>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sparring">{t("sparring")}</SelectItem>
              <SelectItem value="poomsae">{t("poomsae")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Weekly Schedule */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" /> {t("weeklySchedule")}
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={saveSchedule}
            disabled={savingSchedule}
          >
            {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> {t("save")}</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("weeklyScheduleHint")}</p>
        <WeekSchedulePicker schedule={schedule} onChange={setSchedule} />
      </div>

      {/* Training Plan */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4" /> {t("plan")}
          </h4>
          <Button onClick={generatePlan} disabled={generatingPlan} size="sm">
            {generatingPlan ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
            ) : (
              <><Plus className="h-4 w-4 mr-1" /> {t("generatePlan")}</>
            )}
          </Button>
        </div>
        {activePlan ? (
          <AIPlanCard plan={activePlan} />
        ) : (
          <div className="text-center py-6">
            <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("noTrainingPlanYet")}</p>
          </div>
        )}
      </div>

      {/* Rehab Plan */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
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
            disabled={generatingRehab || !rehabDescription.trim()}
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
          <RehabPlanCard plan={activeRehab.plan_data} />
        )}
      </div>
    </div>
  );
}
