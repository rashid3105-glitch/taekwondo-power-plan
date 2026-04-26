// Multi-step post-competition reflection flow.
// Steps: 1) Result + mood, 2) Quick ratings (sliders), 3) Guided reflection
// (free text), 4) AI-generated action plan with goals for next competition.

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineCompetitionReflections } from "@/hooks/useOfflineCompetitionReflections";
import { ReflectionTrendChart } from "@/components/ReflectionTrendChart";
import {
  Trophy, ChevronLeft, ChevronRight, Loader2, Sparkles, Target,
  CheckCircle2, CloudOff, Trash2, Zap,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SupportedLocale = "en" | "da" | "sv" | "de" | "ar" | "no";

interface CompetitionLite {
  id: string;
  name: string;
  event_date: string;
  result?: string | null;
}

interface Props {
  competition: CompetitionLite;
  upcomingCompetitions: CompetitionLite[];
  onClose?: () => void;
}

const moodEmojis = ["😞", "😕", "😐", "🙂", "🤩"];

const ratingKeys = [
  "overallPerformance",
  "mentalReadiness",
  "focusDuringMatches",
  "emotionalControl",
  "tacticalExecution",
  "physicalCondition",
  "recoveryBetweenMatches",
] as const;

const reflectionPrompts = [
  "wentWell",
  "didntGoWell",
  "biggestLearning",
  "whatIdDoDifferently",
  "mentalTriggers",
] as const;

export function PostCompetitionReflection({ competition, upcomingCompetitions, onClose }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const l = (locale as SupportedLocale) || "en";
  const { reflections, submitOffline, removeReflection, updateNextCompetition, refresh } =
    useOfflineCompetitionReflections();

  // existing reflection for this competition (if any)
  const existing = useMemo(
    () => reflections.find((r) => r.competition_id === competition.id) || null,
    [reflections, competition.id],
  );

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resultText, setResultText] = useState(competition.result || "");
  const [mood, setMood] = useState(3);
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(ratingKeys.map((k) => [k, 3])),
  );
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>(
    Object.fromEntries(reflectionPrompts.map((k) => [k, ""])),
  );
  const [nextCompId, setNextCompId] = useState<string>("none");
  const [showDelete, setShowDelete] = useState(false);

  // If a reflection already exists, jump to results screen
  useEffect(() => {
    if (existing) setStep(4);
  }, [existing?.id]);

  const totalSteps = 4;
  const progress = ((step + 1) / (totalSteps + 1)) * 100;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: t("error"), description: "Not signed in", variant: "destructive" }); return; }

      const [{ data: profile }, { data: lastBaseline }] = await Promise.all([
        supabase.from("profiles").select("belt_level, experience_years, age, discipline").eq("user_id", user.id).maybeSingle(),
        supabase.from("mental_assessments").select("scores, created_at").eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const ratingsWithMood = { ...ratings, postCompMood: mood };
      const trimmedReflections = Object.fromEntries(
        Object.entries(reflectionAnswers).map(([k, v]) => [k, (v || "").slice(0, 280)]),
      );

      const synced = await submitOffline({
        competition_id: competition.id,
        competition_name: competition.name,
        competition_date: competition.event_date,
        result: resultText.slice(0, 50) || null,
        ratings: ratingsWithMood,
        reflections: trimmedReflections,
        next_competition_id: nextCompId === "none" ? null : nextCompId,
        profile,
        language: l,
        recentBaselineScores: (lastBaseline?.scores as Record<string, number>) ?? null,
      });

      // Save result back to competitions row for convenience
      if (resultText.trim() && resultText !== competition.result) {
        await supabase.from("competitions").update({ result: resultText.slice(0, 50) }).eq("id", competition.id);
      }

      await refresh();
      setStep(4);
      toast({ title: synced?.ai_plan ? t("reflectionSaved") : t("reflectionSavedOffline") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    await removeReflection(existing.id);
    setShowDelete(false);
    setStep(0);
    setResultText(competition.result || "");
    setMood(3);
    setRatings(Object.fromEntries(ratingKeys.map((k) => [k, 3])));
    setReflectionAnswers(Object.fromEntries(reflectionPrompts.map((k) => [k, ""])));
    toast({ title: t("reflectionDeleted") });
  }

  async function handleNextCompChange(value: string) {
    setNextCompId(value);
    if (existing) {
      await updateNextCompetition(existing.id, value === "none" ? null : value);
    }
  }

  // ---------- Render ----------

  // Step 4: results screen
  if (existing && step === 4) {
    return (
      <div className="space-y-4">
        <ResultsView
          reflection={existing}
          competition={competition}
          upcomingCompetitions={upcomingCompetitions}
          onChangeNextComp={handleNextCompChange}
          onDelete={() => setShowDelete(true)}
        />
        <ReflectionTrendChart reflections={reflections as any} />
        <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("reflectionConfirmDeleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("reflectionConfirmDeleteDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>{t("delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <Card className="p-4 sm:p-6 space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base sm:text-lg">{t("reflectionTitle")}</h2>
          </div>
          <Badge variant="outline" className="text-xs">{step + 1} / {totalSteps}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">{competition.name} · {competition.event_date}</div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Step 0 — Result + mood */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t("reflectionStepResult")}</h3>
          <div>
            <Label className="text-xs">{t("competitionsResult")}</Label>
            <Input
              value={resultText}
              onChange={(e) => setResultText(e.target.value.slice(0, 50))}
              placeholder={t("reflectionResultPlaceholder")}
              maxLength={50}
            />
          </div>
          <div>
            <Label className="text-xs">{t("reflectionMood")}</Label>
            <div className="flex justify-between items-center gap-1 mt-2">
              {moodEmojis.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMood(i + 1)}
                  className={`flex-1 aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                    mood === i + 1
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border bg-background hover:bg-accent/30"
                  }`}
                  aria-label={`mood-${i + 1}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1 — Ratings */}
      {step === 1 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-sm">{t("reflectionStepRatings")}</h3>
          {ratingKeys.map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t(`reflectionRating_${key}` as any)}</span>
                <Badge variant="secondary" className="tabular-nums">{ratings[key]}/5</Badge>
              </div>
              <Slider
                value={[ratings[key]]}
                onValueChange={(v) => setRatings({ ...ratings, [key]: v[0] })}
                min={1} max={5} step={1}
                className="touch-pan-y"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{t("reflectionRatingPoor")}</span>
                <span>{t("reflectionRatingExcellent")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2 — Guided reflection */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t("reflectionStepReflect")}</h3>
          {reflectionPrompts.map((key) => (
            <div key={key}>
              <Label className="text-xs">{t(`reflectionPrompt_${key}` as any)}</Label>
              <Textarea
                value={reflectionAnswers[key]}
                onChange={(e) => setReflectionAnswers({ ...reflectionAnswers, [key]: e.target.value.slice(0, 280) })}
                rows={2}
                maxLength={280}
                placeholder={t(`reflectionPlaceholder_${key}` as any)}
                className="resize-none"
              />
              <div className="text-[10px] text-muted-foreground text-right mt-0.5">
                {reflectionAnswers[key].length} / 280
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 — Review + link to next comp */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t("reflectionStepReview")}</h3>
          <p className="text-xs text-muted-foreground">{t("reflectionReviewDesc")}</p>
          {upcomingCompetitions.length > 0 && (
            <div>
              <Label className="text-xs">{t("reflectionLinkNext")}</Label>
              <Select value={nextCompId} onValueChange={setNextCompId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("reflectionNoNextComp")}</SelectItem>
                  {upcomingCompetitions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} · {c.event_date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!navigator.onLine && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <CloudOff className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{t("reflectionOfflineNote")}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? onClose?.() : setStep(step - 1))}
          disabled={submitting}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? t("cancel") : t("back")}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={submitting}>
            {t("next")} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {t("reflectionGenerate")}
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------- Results view ----------

interface ResultsViewProps {
  reflection: any;
  competition: CompetitionLite;
  upcomingCompetitions: CompetitionLite[];
  onChangeNextComp: (id: string) => void;
  onDelete: () => void;
}

function ResultsView({ reflection, competition, upcomingCompetitions, onChangeNextComp, onDelete }: ResultsViewProps) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [generatingMini, setGeneratingMini] = useState<string | null>(null);
  const plan = reflection.ai_plan;

  async function generateMiniPlan(focusArea: string) {
    setGeneratingMini(focusArea);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const overrides = {
        ...profile,
        program_weeks: 1,
        goals: [focusArea],
      };
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { profile: overrides, language: locale },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      await supabase.from("training_plans").update({ is_active: false }).eq("user_id", user.id);
      const { error: insErr } = await supabase.from("training_plans").insert({
        user_id: user.id,
        name: `${t("reflectionMiniPlanName")}: ${focusArea}`.slice(0, 80),
        plan_data: data.plan,
        is_active: true,
      });
      if (insErr) throw insErr;
      toast({ title: t("reflectionMiniPlanCreated"), description: focusArea });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setGeneratingMini(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">{competition.name}</h2>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {competition.event_date}{reflection.result ? ` · ${reflection.result}` : ""}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {reflection.pending && (
          <Badge variant="outline" className="gap-1"><CloudOff className="h-3 w-3" /> {t("pending")}</Badge>
        )}
      </Card>

      {/* Ratings summary */}
      {reflection.ratings && (
        <Card className="p-4 sm:p-5 space-y-3">
          <h3 className="font-semibold text-sm">{t("reflectionStepRatings")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(reflection.ratings).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
                <span className="text-[11px] text-muted-foreground truncate">{t(`reflectionRating_${k}` as any)}</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">{String(v)}/5</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI plan */}
      {plan ? (
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{t("reflectionPlanTitle")}</h3>
          </div>

          {plan.summary && (
            <p className="text-xs text-muted-foreground leading-relaxed">{plan.summary}</p>
          )}

          {Array.isArray(plan.strengths) && plan.strengths.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-1">{t("reflectionStrengths")}</div>
              <div className="flex flex-wrap gap-1.5">
                {plan.strengths.map((s: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(plan.focusAreas) && plan.focusAreas.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">{t("reflectionFocusAreas")}</div>
              <div className="space-y-2">
                {plan.focusAreas.map((a: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-background/50 p-3 space-y-2">
                    <div className="text-xs font-medium text-foreground">{a.area}</div>
                    {a.why && <div className="text-[11px] text-muted-foreground">{a.why}</div>}
                    {Array.isArray(a.suggestedDrills) && (
                      <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-0.5 pt-1">
                        {a.suggestedDrills.map((d: string, j: number) => <li key={j}>{d}</li>)}
                      </ul>
                    )}
                    <Button
                      size="sm" variant="outline"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => generateMiniPlan(a.area)}
                      disabled={!!generatingMini}
                    >
                      {generatingMini === a.area
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Zap className="h-3 w-3" />}
                      {t("reflectionGenerateMiniPlan")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(plan.nextCompetitionGoals) && plan.nextCompetitionGoals.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-primary" /> {t("reflectionNextGoals")}
              </div>
              <div className="space-y-2">
                {plan.nextCompetitionGoals.map((g: any, i: number) => (
                  <div key={i} className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-xs font-semibold text-foreground">{g.goal}</div>
                    </div>
                    {g.why && <div className="text-[11px] text-muted-foreground pl-6"><span className="font-medium">{t("reflectionGoalWhy")}:</span> {g.why}</div>}
                    {g.how && <div className="text-[11px] text-muted-foreground pl-6"><span className="font-medium">{t("reflectionGoalHow")}:</span> {g.how}</div>}
                    {g.metric && <div className="text-[11px] text-muted-foreground pl-6"><span className="font-medium">{t("reflectionGoalMetric")}:</span> {g.metric}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(plan.mentalRoutineUpdates) && plan.mentalRoutineUpdates.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-1">{t("reflectionRoutineUpdates")}</div>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                {plan.mentalRoutineUpdates.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Link to next comp */}
          {upcomingCompetitions.length > 0 && (
            <div className="pt-2 border-t border-border">
              <Label className="text-xs">{t("reflectionLinkNext")}</Label>
              <Select
                value={reflection.next_competition_id || "none"}
                onValueChange={onChangeNextComp}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("reflectionNoNextComp")}</SelectItem>
                  {upcomingCompetitions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} · {c.event_date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 sm:p-5 text-xs text-muted-foreground italic flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          {t("reflectionPlanWillSync")}
        </Card>
      )}
    </div>
  );
}
