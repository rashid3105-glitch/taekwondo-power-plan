// Multi-step post-competition reflection flow.
// Steps: 1) Result + mood, 2) Quick ratings (sliders), 3) Guided reflection
// (free text), 4) AI-generated action plan with goals for next competition.

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineCompetitionReflections } from "@/hooks/useOfflineCompetitionReflections";
import { ReflectionTrendChart } from "@/components/ReflectionTrendChart";
import {
  Trophy, ChevronLeft, ChevronRight, Loader2, Sparkles, Target,
  CloudOff, Trash2, RefreshCw,
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

const WENT_WELL_OPTIONS = [
  "technique", "speed", "power", "tactics", "mentalStrength",
] as const;

const WORK_ON_OPTIONS = [
  "technique", "speed", "power", "tactics", "mentalStrength",
] as const;

export function PostCompetitionReflection({ competition, upcomingCompetitions, onClose }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const l = (locale as SupportedLocale) || "en";
  const {
    reflections, pendingCount, syncing,
    submitOffline, removeReflection, updateNextCompetition, refresh, syncNow,
  } = useOfflineCompetitionReflections();

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
    Object.fromEntries(ratingKeys.map((k) => [k, 5])),
  );
  const [checkedWentWell, setCheckedWentWell] = useState<string[]>([]);
  const [checkedWorkOn, setCheckedWorkOn] = useState<string[]>([]);
  const [overallNote, setOverallNote] = useState("");
  const [nextCompId, setNextCompId] = useState<string>("none");
  const [showDelete, setShowDelete] = useState(false);

  // If a reflection already exists, jump to results screen
  useEffect(() => {
    if (existing) setStep(4);
  }, [existing?.id]);

  // Listen for background sync flushes (e.g. user came back online) and toast.
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { flushed: number; failed: number };
      if (!detail) return;
      if (detail.flushed > 0) {
        toast({ title: t("reflectionSyncedToast") });
      } else if (detail.failed > 0) {
        toast({ title: t("reflectionSyncFailedToast"), variant: "destructive" });
      }
    };
    window.addEventListener("competition-reflection-sync", handler as EventListener);
    return () => window.removeEventListener("competition-reflection-sync", handler as EventListener);
  }, [toast, t]);

  async function handleSyncNow() {
    const r = await syncNow();
    if (r.flushed > 0) {
      toast({ title: t("reflectionSyncedToast") });
    } else if (r.failed > 0) {
      toast({ title: t("reflectionSyncFailedToast"), description: r.errors[0], variant: "destructive" });
    } else if (pendingCount === 0) {
      toast({ title: t("reflectionNothingToSync") });
    }
  }

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
      const trimmedReflections = {
        wentWell: checkedWentWell.join(", "),
        workOn: checkedWorkOn.join(", "),
        overallNote: overallNote.slice(0, 400),
      };

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
      if (synced?.ai_plan) {
        toast({ title: t("reflectionSaved") });
      } else {
        toast({
          title: t("reflectionSavedOffline"),
          description: navigator.onLine
            ? t("reflectionSavedOnlineRetryDesc")
            : t("reflectionSavedOfflineDesc"),
        });
      }
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
    setRatings(Object.fromEntries(ratingKeys.map((k) => [k, 5])));
    setCheckedWentWell([]);
    setCheckedWorkOn([]);
    setOverallNote("");
    toast({ title: t("reflectionDeleted") });
  }

  async function handleNextCompChange(value: string) {
    setNextCompId(value);
    if (existing) {
      await updateNextCompetition(existing.id, value === "none" ? null : value);
    }
  }

  // ---------- Render ----------

  const pendingBanner = pendingCount > 0 ? (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
      <CloudOff className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{t("reflectionPendingTitle")}</div>
        <div className="text-[11px] opacity-80">{t("reflectionPendingDesc")}</div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleSyncNow}
        disabled={syncing || !navigator.onLine}
        className="h-8 px-2 text-[11px]"
      >
        {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
        {t("reflectionSyncNow")}
      </Button>
    </div>
  ) : null;

  // Step 4: results screen
  if (existing && step === 4) {
    return (
      <div className="space-y-4">
        {pendingBanner}
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
    <div className="space-y-3">
      {pendingBanner}
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
              <div className="text-sm font-medium text-foreground">{t(`reflectionRating_${key}` as any)}</div>
              <div className="grid grid-cols-5 gap-1.5">
                {[1,2,3,4,5,6,7,8,9,10].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRatings({ ...ratings, [key]: v })}
                    className={cn(
                      "h-10 rounded-lg border-2 text-sm font-semibold transition-all",
                      ratings[key] === v
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                <span>{t("reflectionRatingPoor")}</span>
                <span>{t("reflectionRatingExcellent")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2 — Checklist reflection */}
      {step === 2 && (
        <div className="space-y-5">
          <h3 className="font-semibold text-sm">{t("reflectionStepReflect")}</h3>

          {/* Went well */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="text-green-500">✓</span> {t("reflectionWentWellTitle")}
            </div>
            <div className="space-y-1.5">
              {WENT_WELL_OPTIONS.map((opt) => {
                const key = `wentWell_${opt}`;
                const checked = checkedWentWell.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCheckedWentWell(prev =>
                      checked ? prev.filter(x => x !== opt) : prev.length < 5 ? [...prev, opt] : prev
                    )}
                    className={cn(
                      "w-full text-left rounded-xl border-2 px-3 py-2.5 text-sm transition-all",
                      checked
                        ? "border-green-500 bg-green-500/10 text-foreground font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-green-500/50"
                    )}
                  >
                    {t(key as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Work on */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="text-primary">→</span> {t("reflectionWorkOnTitle")}
            </div>
            <div className="space-y-1.5">
              {WORK_ON_OPTIONS.map((opt) => {
                const key = `workOn_${opt}`;
                const checked = checkedWorkOn.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCheckedWorkOn(prev =>
                      checked ? prev.filter(x => x !== opt) : prev.length < 5 ? [...prev, opt] : prev
                    )}
                    className={cn(
                      "w-full text-left rounded-xl border-2 px-3 py-2.5 text-sm transition-all",
                      checked
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {t(key as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overall note */}
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-foreground">{t("reflectionOverallNote")}</div>
            <Textarea
              value={overallNote}
              onChange={(e) => setOverallNote(e.target.value.slice(0, 400))}
              rows={3}
              maxLength={400}
              placeholder={t("reflectionOverallNotePlaceholder")}
              className="resize-none"
            />
            <div className="text-[10px] text-muted-foreground text-right">{overallNote.length}/400</div>
          </div>
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
    </div>
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
  const { t } = useLanguage();
  const plan = reflection.ai_plan;

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
                <span className="text-sm font-semibold text-foreground tabular-nums">{String(v)}/10</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI plan (simplified) */}
      {plan ? (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{t("reflectionPlanTitle")}</h3>
          </div>

          {plan.summary && (
            <p className="text-sm text-foreground leading-relaxed">{plan.summary}</p>
          )}

          {Array.isArray(plan.strengths) && plan.strengths.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("reflectionStrengths")}</div>
              {plan.strengths.map((s: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-green-500 text-base">✓</span> {s}
                </div>
              ))}
            </div>
          )}

          {Array.isArray(plan.focusAreas) && plan.focusAreas.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("reflectionFocusAreas")}</div>
              {plan.focusAreas.map((a: any, i: number) => (
                <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                  <div className="text-sm font-semibold text-foreground">{a.area}</div>
                  {a.tip && <div className="text-sm text-muted-foreground">{a.tip}</div>}
                </div>
              ))}
            </div>
          )}

          {plan.nextGoal && (
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
              <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{t("reflectionNextGoals")}</div>
                <div className="text-sm text-foreground">{plan.nextGoal}</div>
              </div>
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
        <Card className="p-4 text-xs text-muted-foreground italic flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          {t("reflectionPlanWillSync")}
        </Card>
      )}
    </div>
  );
}
