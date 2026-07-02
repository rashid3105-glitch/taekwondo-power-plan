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
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Users, FileText, Trophy, Zap, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { haptics } from "@/lib/haptics";
import { isNativeApp } from "@/lib/platform";

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
  const [clubSearchResults, setClubSearchResults] = useState<{id: string; name: string}[]>([]);
  const [clubSearching, setClubSearching] = useState(false);
  const [selectedExistingClub, setSelectedExistingClub] = useState<{id: string; name: string} | null>(null);
  const [clubAction, setClubAction] = useState<'create' | 'join' | null>(null);

  useEffect(() => {
    if (!clubName.trim() || clubName.trim().length < 2) {
      setClubSearchResults([]);
      setClubAction(null);
      return;
    }
    if (selectedExistingClub && clubName !== selectedExistingClub.name) {
      setSelectedExistingClub(null);
      setClubAction(null);
    }
    const timer = setTimeout(async () => {
      setClubSearching(true);
      const { data } = await supabase
        .from("clubs" as any)
        .select("id, name")
        .ilike("name", `%${clubName.trim()}%`)
        .limit(5);
      const results = (data as any[] ?? []) as {id: string; name: string}[];
      setClubSearchResults(results);
      if (results.length === 0) setClubAction('create');
      setClubSearching(false);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubName]);

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

  const draftKey = userId ? `onboarding_draft_${userId}` : null;

  const saveDraft = () => {
    if (!draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        step, role, discipline, belt, experience, age, weight,
        schedule, goals, otherGoal,
        clubName, athleteCount, focus,
      }));
    } catch { /* localStorage full or disabled — silent fail */ }
  };

  const loadDraft = () => {
    if (!draftKey) return null;
    try {
      const raw = localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const clearDraft = () => {
    if (!draftKey) return;
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
  };

  // Restore draft when user id becomes known
  useEffect(() => {
    if (!userId) return;
    const draft = loadDraft();
    if (!draft) return;
    if (typeof draft.step === "number") setStep(draft.step);
    if (draft.role) setRole(draft.role);
    if (draft.discipline) setDiscipline(draft.discipline);
    if (draft.belt) setBelt(draft.belt);
    if (draft.experience !== undefined) setExperience(draft.experience);
    if (draft.age !== undefined) setAge(draft.age);
    if (draft.weight !== undefined) setWeight(draft.weight);
    if (draft.schedule) setSchedule(draft.schedule);
    if (Array.isArray(draft.goals)) setGoals(draft.goals);
    if (draft.otherGoal) setOtherGoal(draft.otherGoal);
    if (draft.clubName) setClubName(draft.clubName);
    if (draft.athleteCount) setAthleteCount(draft.athleteCount);
    if (Array.isArray(draft.focus)) setFocus(draft.focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Auto-save draft on any tracked field change
  useEffect(() => {
    if (!userId) return;
    saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, step, role, discipline, belt, experience, age, weight,
      schedule, goals, otherGoal, clubName, athleteCount, focus]);

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
    if (!clubAction) { toast.error("Vælg en eksisterende klub eller bekræft oprettelse af ny"); return false; }
    return true;
  };

  // Map server-side validation field paths (from update-my-profile zod schema)
  // to translated, actionable messages. Keep keys aligned with payload field names.
  const mapValidationError = (fieldPath: string): string | null => {
    const root = fieldPath.split(".")[0];
    switch (root) {
      case "age": return t("onbSaveErrorAge");
      case "weight_kg": return t("onbSaveErrorWeight");
      case "belt_level": return t("onbSaveErrorBelt");
      case "goals": return t("onbSaveErrorGoals");
      default: return null;
    }
  };

  // Parse a FunctionsHttpError thrown by supabase-js into a useful shape.
  // The Response object is at error.context in supabase-js v2.
  const parseEdgeError = async (
    error: unknown,
  ): Promise<{ status: number; body: any } | null> => {
    const ctx = (error as any)?.context;
    if (!ctx || typeof ctx !== "object") return null;
    const status: number = typeof ctx.status === "number" ? ctx.status : 0;
    let body: any = null;
    try {
      // clone() so other consumers can still read it
      body = await (ctx as Response).clone().json();
    } catch {
      try { body = await (ctx as Response).clone().text(); } catch { /* ignore */ }
    }
    return { status, body };
  };

  const showValidationToast = (body: any): boolean => {
    // zod flatten() shape: { fieldErrors: { age: ["..."], weight_kg: ["..."] } }
    const fieldErrors = body?.details?.fieldErrors as Record<string, string[]> | undefined;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstField = Object.keys(fieldErrors).find((k) => Array.isArray(fieldErrors[k]) && fieldErrors[k].length > 0);
      if (firstField) {
        const msg = mapValidationError(firstField) ?? `${firstField}: ${fieldErrors[firstField][0]}`;
        toast.error(msg);
        return true;
      }
    }
    return false;
  };

  const invokeUpdateProfile = async (payload: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    return supabase.functions.invoke("update-my-profile", {
      body: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
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

      let { error } = await invokeUpdateProfile(payload);

      // If auth expired (401), try to refresh the session ONCE then retry.
      if (error) {
        const parsed = await parseEdgeError(error);
        if (parsed?.status === 401) {
          const { error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr) {
            const retry = await invokeUpdateProfile(payload);
            error = retry.error ?? null;
          }
        }
        if (error) {
          const parsedAfter = await parseEdgeError(error);
          if (parsedAfter?.status === 401 || parsedAfter?.status === 403) {
            toast.error(t("onbSaveErrorAuth"));
            setSaving(false);
            return;
          }
          if (parsedAfter?.status === 400 && showValidationToast(parsedAfter.body)) {
            setSaving(false);
            return;
          }
          throw error;
        }
      }

      // Coach: opret eller tilknyt klub
      if (role === "coach") {
        let clubId: string | null = null;
        if (selectedExistingClub && clubAction === 'join') {
          clubId = selectedExistingClub.id;
        } else {
          const slug = clubName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const { data: newClub, error: clubError } = await supabase
            .from("clubs" as any)
            .insert({ name: clubName.trim(), slug, max_athletes: 5 } as any)
            .select("id")
            .single();
          if (clubError) throw clubError;
          clubId = (newClub as any).id;
        }
        await supabase
          .from("profiles")
          .update({ club_id: clubId } as any)
          .eq("user_id", userId);
        await supabase
          .from("club_memberships" as any)
          .upsert({
            user_id: userId,
            club_id: clubId,
            role_in_club: 'coach',
            status: 'active',
          } as any, { onConflict: 'user_id,club_id' });
      }

      clearDraft();

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
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        supabase.functions.invoke("generate-plan", {
          body: {},
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(() => { /* non-blocking */ });
      }

      haptics.success();

      // After onboarding, send athletes without an active subscription to /pricing.
      // Skip entirely in native builds (App Store / Google Play): no pricing surface allowed.
      if (role !== "coach" && userId && !isNativeApp()) {
        try {
          const { data: subRow } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("user_id", userId)
            .maybeSingle();
          const { data: pf } = await supabase.rpc("get_profile_protected_fields", {
            _user_id: userId,
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
      {userId && (
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                saveDraft();
                toast.success(t("onboardingDraftSavedToast"));
                await supabase.auth.signOut();
                navigate("/");
              }}
              className="gap-2 text-muted-foreground hover:text-foreground"
              aria-label={t("onboardingExitForNow")}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("onboardingExitForNow")}</span>
            </Button>
          </div>
        </div>
      )}
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
                            discipline === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-card-foreground"
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
                      <SelectTrigger className="h-11 bg-card text-card-foreground"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger className="h-11 bg-card text-card-foreground"><SelectValue /></SelectTrigger>
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
                      <Input id="age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="h-11 bg-card text-card-foreground placeholder:text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">{t("onbWeightKg")}</Label>
                      <Input id="weight" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-11 bg-card text-card-foreground placeholder:text-muted-foreground" />
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
                          goals.includes(g.label) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-card-foreground"
                        }`}
                      >
                        <Checkbox checked={goals.includes(g.label)} className="pointer-events-none" />
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherGoal">{t("onbOtherGoal")}</Label>
                    <Input id="otherGoal" value={otherGoal} onChange={(e) => setOtherGoal(e.target.value)} className="h-11 bg-card text-card-foreground placeholder:text-muted-foreground" />
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
                    <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-11 bg-card text-card-foreground placeholder:text-muted-foreground" />

                    {clubSearching && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Søger efter eksisterende klubber...
                      </div>
                    )}

                    {!clubSearching && clubSearchResults.length > 0 && !selectedExistingClub && (
                      <div className="rounded-md border border-border bg-card divide-y divide-border">
                        <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
                          Disse klubber eksisterer allerede — vil du tilknytte dig en af dem?
                        </div>
                        {clubSearchResults.map(club => (
                          <button
                            key={club.id}
                            type="button"
                            onClick={() => {
                              setSelectedExistingClub(club);
                              setClubName(club.name);
                              setClubAction('join');
                              setClubSearchResults([]);
                            }}
                            className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                          >
                            <span>{club.name}</span>
                            <span className="text-xs text-primary font-medium">Tilknyt mig →</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setClubAction('create');
                            setClubSearchResults([]);
                          }}
                          className="w-full px-3 py-2.5 text-left text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                          Nej, opret ny klub med dette navn
                        </button>
                      </div>
                    )}

                    {clubAction === 'join' && selectedExistingClub && (
                      <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary">
                        <span>✓</span>
                        <span>Du tilknyttes <strong>{selectedExistingClub.name}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExistingClub(null);
                            setClubAction(null);
                            setClubName("");
                          }}
                          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                        >
                          Fortryd
                        </button>
                      </div>
                    )}

                    {clubAction === 'create' && clubName.trim() && (
                      <div className="flex items-center gap-2 rounded-md bg-muted/50 border border-border px-3 py-2 text-sm text-muted-foreground">
                        <span>＋</span>
                        <span>Ny klub oprettes: <strong className="text-foreground">{clubName.trim()}</strong> — maks 5 atleter</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onbAthleteCount")}</Label>
                    <Select value={athleteCount} onValueChange={setAthleteCount}>
                      <SelectTrigger className="h-11 bg-card text-card-foreground"><SelectValue /></SelectTrigger>
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
                            focus.includes(f.id) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-card-foreground"
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
