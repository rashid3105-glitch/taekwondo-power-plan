import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, Apple, Utensils, Flame, ChevronDown, ChevronUp, Download, Trash2, Info, Target } from "lucide-react";
import jsPDF from "jspdf";
import { getMealImage } from "@/data/recipeImages";
import { AssistantDisclosure } from "@/components/AssistantDisclosure";
import type { WeightGoal } from "@/lib/weightPlanner";

interface NutritionPlanProps {
  profile: {
    age: number | null;
    weight_kg: number | null;
    belt_level: string;
    discipline: string;
    tkd_sessions_per_week: number;
    experience_years: number | null;
    current_injury: string | null;
    custom_calories?: number | null;
    birth_date?: string | null;
  } | null;
  readOnly?: boolean;
  userId?: string;
  /** Active weight goal from the nutrition setup — the plan is derived from it. */
  goal?: (WeightGoal & { id?: string }) | null;
  /** Daily calorie target already computed by the weight module. */
  dailyTargetKcal?: number | null;
  /** Opens the guided nutrition setup when no goal exists yet. */
  onSetGoals?: () => void;
}

/** Maps the answers from the guided setup to nutrition goals for the plan. */
function deriveGoals(goal?: (WeightGoal & { id?: string }) | null): string[] {
  if (!goal) return [];
  const base =
    goal.direction === "loss"
      ? "Weight loss"
      : goal.direction === "gain"
        ? "Build lean muscle"
        : "Improve performance";
  const extras = (goal.motivations ?? []).slice(0, 3).filter(Boolean);
  return [base, ...extras];
}

export function NutritionPlan({ profile, readOnly = false, userId, goal = null, dailyTargetKcal = null, onSetGoals }: NutritionPlanProps) {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [customCalories, setCustomCalories] = useState<string>("");
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const selectedGoals = deriveGoals(goal);


  // Load saved plan on mount
  useEffect(() => {
    const loadSavedPlan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;
        if (!targetUserId) { setLoadingPlan(false); return; }

        const { data, error } = await supabase
          .from("nutrition_plans")
          .select("*")
          .eq("user_id", targetUserId)
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setPlan(data.plan_data);
          setCustomCalories(data.custom_calories?.toString() || "");
          setCustomCalories(data.custom_calories?.toString() || "");
          setSavedPlanId(data.id);
          toast({ title: t("savedNutritionPlan") });
        }
      } catch (err) {
        console.error("Failed to load nutrition plan:", err);
      } finally {
        setLoadingPlan(false);
      }
    };
    loadSavedPlan();
  }, [userId]);

  const savePlan = useCallback(async (planData: any, goals: string[], calories: number | null, existingId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (existingId) {
        await supabase
          .from("nutrition_plans")
          .update({
            plan_data: planData,
            goals,
            custom_calories: calories,
            name: planData?.planName || "Nutrition Plan",
          })
          .eq("id", existingId);
        return existingId;
      } else {
        const { data, error } = await supabase
          .from("nutrition_plans")
          .insert({
            user_id: user.id,
            plan_data: planData,
            goals,
            custom_calories: calories,
            name: planData?.planName || "Nutrition Plan",
          })
          .select("id")
          .single();
        if (error) throw error;
        return data?.id || null;
      }
    } catch (err) {
      console.error("Failed to save nutrition plan:", err);
      return null;
    }
  }, []);

  const hasWeightLossGoal = selectedGoals.some(
    (g) => g === "Weight loss" || g === "Competition prep (weight class)"
  );


  const generatePlan = async () => {
    let age = profile?.age ?? null;
    if (profile && age == null && profile.birth_date) {
      const bd = new Date(profile.birth_date);
      const today = new Date();
      let a = today.getFullYear() - bd.getFullYear();
      const m = today.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
      if (a > 0) age = a;
    }
    if (!profile || age == null || profile.weight_kg == null) {
      toast({ title: t("error"), description: t("profileRequired") || "Udfyld din profil (alder og vægt) først", variant: "destructive" });
      return;
    }
    if (selectedGoals.length === 0) {
      toast({ title: t("error"), description: t("selectNutritionGoals"), variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-nutrition-plan", {
        body: { profile: { ...profile, age }, goals: selectedGoals, language: locale, custom_calories: profile?.custom_calories || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.plan) throw new Error("No plan returned");
      setPlan(data.plan);
      const id = await savePlan(data.plan, selectedGoals, customCalories ? parseInt(customCalories) : null, savedPlanId);
      if (id) setSavedPlanId(id);
      toast({ title: t("nutritionPlanGenerated") });
    } catch (err: any) {
      console.error("generate-nutrition-plan failed", err);
      toast({ title: t("error"), description: err?.message || "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async () => {
    if (!savedPlanId) {
      setPlan(null);
      return;
    }
    if (!window.confirm(t("deletePlanConfirm") || "Slet plan?")) return;
    try {
      const { error } = await supabase
        .from("nutrition_plans")
        .update({ is_active: false })
        .eq("id", savedPlanId);
      if (error) throw error;
      setPlan(null);
      setSavedPlanId(null);
      setCustomCalories("");
      toast({ title: t("planDeleted") || "Plan slettet" });
    } catch (err: any) {
      toast({ title: t("error"), description: err?.message, variant: "destructive" });
    }
  };


  const downloadPDF = () => {
    if (!plan) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPage = (needed: number) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        y = 20;
      }
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(plan.planName || t("nutrition"), margin, y);
    y += 10;




    // Macros overview
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    checkPage(12);
    doc.text(`${t("calories")}: ${plan.dailyCalorieEstimate || "—"}`, margin, y);
    y += 6;
    if (customCalories) {
      doc.setFont("helvetica", "normal");
      doc.text(`${t("customCalories")}: ${customCalories} ${t("kcalPerDay")}`, margin, y);
      y += 6;
    }
    if (plan.macroSplit) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`${t("protein")}: ${plan.macroSplit.protein}  |  ${t("carbs")}: ${plan.macroSplit.carbs}  |  ${t("fats")}: ${plan.macroSplit.fats}`, margin, y);
      y += 8;
    }




    // Meals
    if (plan.meals?.length) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      checkPage(10);
      doc.text(t("dailyMeals"), margin, y);
      y += 7;
      for (const meal of plan.meals) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        checkPage(16);
        doc.text(`${meal.name} — ${meal.timing}`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        if (meal.foods) {
          for (const food of meal.foods) {
            const lines = doc.splitTextToSize(`  • ${food}`, maxWidth);
            checkPage(lines.length * 4);
            doc.text(lines, margin, y);
            y += lines.length * 4;
          }
        }
        if (meal.macroFocus) {
          checkPage(5);
          doc.setFont("helvetica", "italic");
          doc.text(meal.macroFocus, margin, y);
          y += 4;
          doc.setFont("helvetica", "normal");
        }
        if (meal.whyItMatters) {
          const lines = doc.splitTextToSize(meal.whyItMatters, maxWidth);
          checkPage(lines.length * 4);
          doc.text(lines, margin, y);
          y += lines.length * 4 + 2;
        }
        y += 3;
      }
    }




    doc.save(`${plan.planName || "nutrition-plan"}.pdf`);
  };

  if (loadingPlan) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan source: goals come from the guided nutrition setup */}
      {!readOnly && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-tab-nutrition" />
            <h3 className="font-bold text-card-foreground">{t("nutritionPlanTitle")}</h3>
          </div>

          {selectedGoals.length === 0 ? (
            <>
              <p className="text-xs text-muted-foreground">{t("nutritionNeedsGoalDesc")}</p>
              {onSetGoals && (
                <Button onClick={onSetGoals} size="sm" variant="outline" className="w-full sm:w-auto">
                  <Target className="h-4 w-4 mr-1" /> {t("wpSetGoal")}
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedGoals.map((g) => (
                  <span key={g} className="rounded-full bg-primary/15 border border-primary/30 text-primary px-2.5 py-1 text-[11px] font-medium">
                    {t(g) || g}
                  </span>
                ))}
                {dailyTargetKcal ? (
                  <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                    {dailyTargetKcal} kcal
                  </span>
                ) : null}
              </div>

              <AssistantDisclosure />

              <Button onClick={generatePlan} disabled={generating} size="sm" className="w-full sm:w-auto">
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
                ) : (
                  <><Apple className="h-4 w-4 mr-1" /> {t("generateNutritionPlan")}</>
                )}
              </Button>
            </>
          )}

          <Link
            to="/help#helpNutritionFaq"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary"
          >
            <Info className="h-3.5 w-3.5" /> {t("nutritionPlanGuidanceLink")}
          </Link>
        </div>
      )}

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-4">


          {/* Overview */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-card-foreground truncate">{plan.planName}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
                {!readOnly && (
                  <Button variant="outline" size="sm" onClick={deletePlan} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Flame className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">{t("calories")}</p>
                <p className="text-sm font-bold text-card-foreground">{plan.dailyCalorieEstimate}</p>
              </div>
              {plan.macroSplit && (
                <>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t("protein")}</p>
                    <p className="text-sm font-bold text-card-foreground">{plan.macroSplit.protein}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t("carbs")}</p>
                    <p className="text-sm font-bold text-card-foreground">{plan.macroSplit.carbs}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t("fats")}</p>
                    <p className="text-sm font-bold text-card-foreground">{plan.macroSplit.fats}</p>
                  </div>
                </>
              )}
            </div>

            {/* Custom Calorie Display (from profile) */}
            {profile?.custom_calories && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t("dailyCalorieTarget")}</p>
                <p className="text-sm font-bold text-card-foreground">{profile.custom_calories} {t("kcalPerDay")}</p>
              </div>
            )}
            {/* Backward compat: show saved custom_calories from plan if no profile value */}
            {!profile?.custom_calories && customCalories && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t("customCalories")}</p>
                <p className="text-sm font-bold text-card-foreground">{customCalories} {t("kcalPerDay")}</p>
              </div>
            )}
          </div>




          {/* Meals */}
          {plan.meals?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
              <h4 className="font-semibold text-sm text-card-foreground flex items-center gap-2">
                <Utensils className="h-4 w-4 text-tab-nutrition" /> {t("dailyMeals")}
              </h4>
              <div className="space-y-2">
                {plan.meals.map((meal: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
                      className="w-full flex items-center justify-between p-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">{meal.timing}</p>
                      </div>
                      {expandedMeal === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {expandedMeal === i && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                        <img
                          src={getMealImage(meal.name)}
                          alt={meal.name}
                          loading="lazy"
                          className="w-full h-36 sm:h-44 object-cover rounded-md border border-border"
                        />
                        <div>
                          <p className="text-xs font-medium text-card-foreground mb-1">{t("foods")}:</p>
                          <ul className="space-y-0.5">
                            {meal.foods?.map((food: string, j: number) => (
                              <li key={j} className="text-xs text-muted-foreground">• {food}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-primary font-medium">{meal.macroFocus}</p>
                        <p className="text-xs text-muted-foreground italic">{meal.whyItMatters}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hydration and supplement guidance now lives in the help section */}


          {/* Weekly Variation */}
          {plan.weeklyVariation && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
              <h4 className="font-semibold text-sm text-card-foreground mb-2">{t("weeklyVariation")}</h4>
              <p className="text-xs text-muted-foreground">{plan.weeklyVariation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
