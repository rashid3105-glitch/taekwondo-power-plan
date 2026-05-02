import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Users, FileText, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { haptics } from "@/lib/haptics";

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday", type: "tkd" },
  { day: "Tuesday", type: "gym" },
  { day: "Wednesday", type: "tkd" },
  { day: "Thursday", type: "rest" },
  { day: "Friday", type: "tkd" },
  { day: "Saturday", type: "gym" },
  { day: "Sunday", type: "rest" },
];

type Role = "athlete" | "coach";

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("athlete");
  const [isApproved, setIsApproved] = useState(false);
  const [step, setStep] = useState(0);

  // Athlete fields
  const [discipline, setDiscipline] = useState<"sparring" | "poomsae">("sparring");
  const [belt, setBelt] = useState("white");
  const [experience, setExperience] = useState("under1");
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [goals, setGoals] = useState<string[]>([]);
  const [otherGoal, setOtherGoal] = useState("");

  // Coach fields
  const [clubName, setClubName] = useState("");
  const [athleteCount, setAthleteCount] = useState("1to5");
  const [focus, setFocus] = useState<string[]>([]);
  const [coachSlide, setCoachSlide] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      if ((profile as any)?.onboarding_completed) {
        const userRoles = (roles || []).map((r: any) => r.role);
        navigate(userRoles.includes("coach") || userRoles.includes("admin") ? "/coach" : "/dashboard");
        return;
      }

      const meta = user.user_metadata || {};
      const wantsCoach = meta.wants_coach === true;
      const userRoles = (roles || []).map((r: any) => r.role);
      const isCoach = wantsCoach || userRoles.includes("coach") || userRoles.includes("admin");
      setRole(isCoach ? "coach" : "athlete");
      setIsApproved((profile as any)?.is_approved === true);
      setLoading(false);
    })();
  }, [navigate]);

  const totalSteps = role === "athlete" ? 4 : 3; // welcome + steps
  const stepLabel = useMemo(
    () => t("onbStepLabel").replace("{{current}}", String(step)).replace("{{total}}", String(totalSteps - 1)),
    [step, totalSteps, t]
  );

  const toggleGoal = (g: string) => setGoals((p) => p.includes(g) ? p.filter((x) => x !== g) : [...p, g]);
  const toggleFocus = (f: string) => setFocus((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);

  const next = () => { haptics.tap(); setStep((s) => s + 1); };
  const back = () => { haptics.tap(); setStep((s) => Math.max(0, s - 1)); };

  const validateAthleteStep1 = () => {
    if (!age || !weight) { toast.error(t("onbValidationMissing")); return false; }
    return true;
  };
  const validateAthleteStep2 = () => {
    if (!schedule.some((d) => d.type === "rest")) { toast.error(t("onbAtLeastOneRest")); return false; }
    return true;
  };
  const validateCoachStep1 = () => {
    if (!clubName.trim()) { toast.error(t("onbValidationMissing")); return false; }
    return true;
  };

  const finish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const goalsList = [...goals, ...(otherGoal.trim() ? [otherGoal.trim()] : [])];
      const expMap: Record<string, number> = { under1: 0, "1to3": 2, "3to7": 5, "7plus": 8 };

      const payload: Record<string, unknown> = {
        onboarding_completed: true,
      };

      if (role === "athlete") {
        Object.assign(payload, {
          discipline,
          belt_level: belt,
          experience_years: expMap[experience] ?? 0,
          age: Number(age),
          weight_kg: Number(weight),
          weekly_schedule: schedule,
          goals: goalsList,
        });
      } else {
        Object.assign(payload, {
          coach_club_name: clubName.trim(),
          coach_athlete_count_band: athleteCount,
          coach_focus: focus,
        });
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { error } = await supabase.functions.invoke("update-my-profile", {
        body: payload,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error) throw error;

      // Apply pending invite (athlete signed up via /join/CODE)
      const pendingInvite = sessionStorage.getItem("pending_invite_code");
      if (role === "athlete" && pendingInvite) {
        sessionStorage.removeItem("pending_invite_code");
        await supabase.rpc("apply_invite_to_my_profile" as any, { _code: pendingInvite });
        haptics.success();
        toast.success(t("joinRequestSent"));
        await supabase.auth.signOut();
        navigate("/");
        return;
      }

      // Background plan generation for approved athletes
      if (role === "athlete" && isApproved) {
        setGenerating(true);
        supabase.functions.invoke("generate-plan", {
          body: {},
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => { /* non-blocking */ });
      }

      haptics.success();

      // After onboarding, send athletes without an active subscription to /pricing
      if (role !== "coach") {
        try {
          const { data: subRow } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("user_id", session!.user.id)
            .maybeSingle();
          const { data: pf } = await supabase.rpc("get_profile_protected_fields", {
            _user_id: session!.user.id,
          });
          const hasAccess =
            subRow?.status === "active" ||
            pf?.[0]?.payment_status === "paid" ||
            pf?.[0]?.is_demo ||
            pf?.[0]?.demo_full_access;
          if (!hasAccess) {
            navigate("/pricing?welcome=1");
            return;
          }
        } catch { /* fall through to dashboard */ }
      }

      navigate(role === "coach" ? "/coach" : "/dashboard");
    } catch (e) {
      console.error(e);
      toast.error(t("onbSaveError"));
      setSaving(false);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const goalOptions = [
    { id: "technique", label: t("onbGoalTechnique") },
    { id: "compete", label: t("onbGoalCompete") },
    { id: "weight", label: t("onbGoalWeight") },
    { id: "conditioning", label: t("onbGoalConditioning") },
    { id: "recovery", label: t("onbGoalRecovery") },
    { id: "fitness", label: t("onbGoalFitness") },
  ];
  const focusOptions = [
    { id: "competition", label: t("onbFocusCompetition") },
    { id: "technique", label: t("onbFocusTechnique") },
    { id: "recruitment", label: t("onbFocusRecruitment") },
    { id: "fitness", label: t("onbFocusFitness") },
  ];
  const beltOptions = ["white", "yellow", "green", "blue", "red", "black"];
  const beltLabel: Record<string, string> = {
    white: t("onbBeltWhite"), yellow: t("onbBeltYellow"), green: t("onbBeltGreen"),
    blue: t("onbBeltBlue"), red: t("onbBeltRed"), black: t("onbBeltBlack"),
  };

  const coachSlides = [
    { icon: Users, title: t("onbCoachSlide1Title"), body: t("onbCoachSlide1Body") },
    { icon: FileText, title: t("onbCoachSlide2Title"), body: t("onbCoachSlide2Body") },
    { icon: Trophy, title: t("onbCoachSlide3Title"), body: t("onbCoachSlide3Body") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
        {step > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={back} disabled={saving} className="h-9">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("onbBack")}
            </Button>
            <div className="flex-1">
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps - 1 }).map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
              <div className="mt-1.5 text-xs text-muted-foreground">{stepLabel}</div>
            </div>
          </div>
        )}

        <Card className="p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${role}-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Welcome */}
              {step === 0 && (
                <div className="text-center py-6">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-3">{t("onbWelcomeTitle")}</h1>
                  <p className="text-muted-foreground mb-8">{t("onbWelcomeSubtitle")}</p>
                  <Button size="lg" className="h-12 px-8" onClick={next}>
                    {t("onbWelcomeCta")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* ATHLETE FLOW */}
              {role === "athlete" && step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold">{t("onbAthleteStep1Title")}</h2>

                  <div className="space-y-2">
                    <Label>{t("onbDiscipline")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["sparring", "poomsae"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDiscipline(d)}
                          className={`h-11 rounded-md border-2 text-sm font-medium transition ${
                            discipline === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
                          }`}
                        >
                          {d === "sparring" ? t("onbDisciplineSparring") : t("onbDisciplinePoomsae")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onbBeltLevel")}</Label>
                    <Select value={belt} onValueChange={setBelt}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {beltOptions.map((b) => (
                          <SelectItem key={b} value={b}>{beltLabel[b]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onbExperience")}</Label>
                    <Select value={experience} onValueChange={setExperience}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under1">{t("onbExpUnder1")}</SelectItem>
                        <SelectItem value="1to3">{t("onbExp1to3")}</SelectItem>
                        <SelectItem value="3to7">{t("onbExp3to7")}</SelectItem>
                        <SelectItem value="7plus">{t("onbExp7plus")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="age">{t("onbAge")}</Label>
                      <Input id="age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">{t("onbWeightKg")}</Label>
                      <Input id="weight" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-11" />
                    </div>
                  </div>

                  <Button className="w-full h-12" onClick={() => { if (validateAthleteStep1()) next(); }}>
                    {t("onbContinue")}
                  </Button>
                </div>
              )}

              {role === "athlete" && step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">{t("onbAthleteStep2Title")}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t("onbAthleteStep2Sub")}</p>
                  </div>
                  <WeekSchedulePicker schedule={schedule} onChange={setSchedule} />
                  <Button className="w-full h-12" onClick={() => { if (validateAthleteStep2()) next(); }}>
                    {t("onbContinue")}
                  </Button>
                </div>
              )}

              {role === "athlete" && step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">{t("onbAthleteStep3Title")}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t("onbAthleteStep3Sub")}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {goalOptions.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGoal(g.label)}
                        className={`flex items-center gap-2 rounded-md border-2 p-3 text-left text-sm transition ${
                          goals.includes(g.label) ? "border-primary bg-primary/10" : "border-border bg-background"
                        }`}
                      >
                        <Checkbox checked={goals.includes(g.label)} className="pointer-events-none" />
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherGoal">{t("onbOtherGoal")}</Label>
                    <Input id="otherGoal" value={otherGoal} onChange={(e) => setOtherGoal(e.target.value)} className="h-11" />
                  </div>

                  <Button className="w-full h-12" onClick={finish} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        {t("onbFinish")}
                      </>
                    )}
                  </Button>

                  {generating && (
                    <div className="text-center text-sm text-muted-foreground">
                      <p className="font-medium">{t("onbGeneratingPlan")}</p>
                      <p className="text-xs mt-1">{t("onbGeneratingPlanSub")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* COACH FLOW */}
              {role === "coach" && step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold">{t("onbCoachStep1Title")}</h2>

                  <div className="space-y-2">
                    <Label htmlFor="clubName">{t("onbClubName")}</Label>
                    <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onbAthleteCount")}</Label>
                    <Select value={athleteCount} onValueChange={setAthleteCount}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1to5">{t("onbCount1to5")}</SelectItem>
                        <SelectItem value="6to15">{t("onbCount6to15")}</SelectItem>
                        <SelectItem value="16to30">{t("onbCount16to30")}</SelectItem>
                        <SelectItem value="30plus">{t("onbCount30plus")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onbPrimaryFocus")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {focusOptions.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFocus(f.id)}
                          className={`h-11 rounded-md border-2 text-sm transition ${
                            focus.includes(f.id) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full h-12" onClick={() => { if (validateCoachStep1()) next(); }}>
                    {t("onbContinue")}
                  </Button>
                </div>
              )}

              {role === "coach" && step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-semibold">{t("onbCoachStep2Title")}</h2>

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={coachSlide}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-lg border bg-card p-6 text-center"
                      >
                        {(() => {
                          const Icon = coachSlides[coachSlide].icon;
                          return (
                            <>
                              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <h3 className="font-semibold mb-2">{coachSlides[coachSlide].title}</h3>
                              <p className="text-sm text-muted-foreground">{coachSlides[coachSlide].body}</p>
                            </>
                          );
                        })()}
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-4 flex justify-center gap-1.5">
                      {coachSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCoachSlide(i)}
                          className={`h-1.5 rounded-full transition-all ${i === coachSlide ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {coachSlide < coachSlides.length - 1 ? (
                    <Button className="w-full h-12" onClick={() => setCoachSlide((s) => s + 1)}>
                      {t("onbContinue")}
                    </Button>
                  ) : (
                    <Button className="w-full h-12" onClick={finish} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("onbGoToDashboard")}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
