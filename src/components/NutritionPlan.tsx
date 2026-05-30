import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, Apple, AlertTriangle, Droplets, Pill, Utensils, Flame, ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { getMealImage } from "@/data/recipeImages";

const NUTRITION_GOALS = [
  "Improve performance",
  "Build lean muscle",
  "Weight loss",
  "Better recovery",
  "More energy for training",
  "Competition prep (weight class)",
  "General healthy eating",
  "Reduce inflammation",
];

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
  } | null;
  readOnly?: boolean;
  userId?: string;
}

export function NutritionPlan({ profile, readOnly = false, userId }: NutritionPlanProps) {
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [customCalories, setCustomCalories] = useState<string>("");
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

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
          setSelectedGoals(data.goals || []);
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

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const hasWeightLossGoal = selectedGoals.some(
    (g) => g === "Weight loss" || g === "Competition prep (weight class)"
  );

  const generatePlan = async () => {
    if (!profile) return;
    if (selectedGoals.length === 0) {
      toast({ title: t("error"), description: t("selectNutritionGoals"), variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-nutrition-plan", {
        body: { profile, goals: selectedGoals, language: locale, custom_calories: profile?.custom_calories || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data.plan);
      const id = await savePlan(data.plan, selectedGoals, customCalories ? parseInt(customCalories) : null, savedPlanId);
      if (id) setSavedPlanId(id);
      toast({ title: t("nutritionPlanGenerated") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
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

    // Health warning
    if (plan.healthWarning) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 0, 0);
      const warnLines = doc.splitTextToSize(`⚠ ${plan.healthWarning}`, maxWidth);
      checkPage(warnLines.length * 4 + 4);
      doc.text(warnLines, margin, y);
      y += warnLines.length * 4 + 6;
      doc.setTextColor(0, 0, 0);
    }

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

    // Key principles
    if (plan.keyPrinciples?.length) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      checkPage(10);
      doc.text(t("keyPrinciples"), margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      for (const p of plan.keyPrinciples) {
        const lines = doc.splitTextToSize(`• ${p}`, maxWidth);
        checkPage(lines.length * 4 + 2);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;
      }
      y += 4;
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

    // Hydration
    if (plan.hydration) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      checkPage(10);
      doc.text(t("hydration"), margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const h = plan.hydration;
      const hydLines = [
        `${t("daily")}: ${h.daily}`,
        `${t("preTraining")}: ${h.preTrain}`,
        `${t("duringTraining")}: ${h.duringTrain}`,
        `${t("postTraining")}: ${h.postTrain}`,
      ];
      for (const line of hydLines) {
        checkPage(5);
        doc.text(line, margin, y);
        y += 5;
      }
      y += 4;
    }

    // Supplements
    if (plan.supplements?.length) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      checkPage(10);
      doc.text(t("supplements"), margin, y);
      y += 6;
      for (const s of plan.supplements) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        checkPage(12);
        doc.text(s.name, margin, y);
        y += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${s.dosage} · ${s.timing}`, margin, y);
        y += 4;
        const rLines = doc.splitTextToSize(s.reason, maxWidth);
        checkPage(rLines.length * 4);
        doc.text(rLines, margin, y);
        y += rLines.length * 4;
        if (s.warning) {
          doc.setTextColor(180, 100, 0);
          const wLines = doc.splitTextToSize(`⚠ ${s.warning}`, maxWidth);
          checkPage(wLines.length * 4);
          doc.text(wLines, margin, y);
          y += wLines.length * 4;
          doc.setTextColor(0, 0, 0);
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
      {/* Health Warning Banner */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-foreground">{t("nutritionDisclaimer")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("nutritionDisclaimerDesc")}</p>
        </div>
      </div>

      {/* Goal Selection */}
      {!readOnly && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-tab-nutrition" />
            <h3 className="font-bold text-foreground">{t("nutritionGoals")}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{t("selectNutritionGoals")}</p>
          <div className="flex flex-wrap gap-2">
            {NUTRITION_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                data-active={selectedGoals.includes(goal)}
                className="rounded-full px-3 py-1.5 text-xs font-medium border border-border transition-colors cursor-pointer
                  data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
                  data-[active=false]:text-muted-foreground hover:text-foreground"
              >
                {t(goal) || goal}
              </button>
            ))}
          </div>

          {/* Weight Loss Warning */}
          {hasWeightLossGoal && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-destructive">{t("weightLossWarningTitle")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("weightLossWarningDesc")}</p>
              </div>
            </div>
          )}

          <Button onClick={generatePlan} disabled={generating || selectedGoals.length === 0} size="sm" className="w-full sm:w-auto">
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("generating")}</>
            ) : (
              <><Apple className="h-4 w-4 mr-1" /> {t("generateNutritionPlan")}</>
            )}
          </Button>
        </div>
      )}

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-4">
          {/* Health Warning from AI */}
          {plan.healthWarning && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{plan.healthWarning}</p>
            </div>
          )}

          {/* Overview */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">{plan.planName}</h3>
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Flame className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">{t("calories")}</p>
                <p className="text-sm font-bold text-foreground">{plan.dailyCalorieEstimate}</p>
              </div>
              {plan.macroSplit && (
                <>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t("protein")}</p>
                    <p className="text-sm font-bold text-foreground">{plan.macroSplit.protein}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t("carbs")}</p>
                    <p className="text-sm font-bold text-foreground">{plan.macroSplit.carbs}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t("fats")}</p>
                    <p className="text-sm font-bold text-foreground">{plan.macroSplit.fats}</p>
                  </div>
                </>
              )}
            </div>

            {/* Custom Calorie Display (from profile) */}
            {profile?.custom_calories && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t("dailyCalorieTarget")}</p>
                <p className="text-sm font-bold text-foreground">{profile.custom_calories} {t("kcalPerDay")}</p>
              </div>
            )}
            {/* Backward compat: show saved custom_calories from plan if no profile value */}
            {!profile?.custom_calories && customCalories && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{t("customCalories")}</p>
                <p className="text-sm font-bold text-foreground">{customCalories} {t("kcalPerDay")}</p>
              </div>
            )}
          </div>

          {/* Key Principles */}
          {plan.keyPrinciples?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-2">
              <h4 className="font-semibold text-sm text-foreground">{t("keyPrinciples")}</h4>
              <ul className="space-y-1.5">
                {plan.keyPrinciples.map((p: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary font-bold">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meals */}
          {plan.meals?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
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
                        <p className="text-sm font-medium text-foreground">{meal.name}</p>
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
                          <p className="text-xs font-medium text-foreground mb-1">{t("foods")}:</p>
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

          {/* Hydration */}
          {plan.hydration && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-2">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Droplets className="h-4 w-4" /> {t("hydration")}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">{t("daily")}</p>
                  <p className="text-xs font-medium text-foreground">{plan.hydration.daily}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">{t("preTraining")}</p>
                  <p className="text-xs font-medium text-foreground">{plan.hydration.preTrain}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">{t("duringTraining")}</p>
                  <p className="text-xs font-medium text-foreground">{plan.hydration.duringTrain}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">{t("postTraining")}</p>
                  <p className="text-xs font-medium text-foreground">{plan.hydration.postTrain}</p>
                </div>
              </div>
            </div>
          )}

          {/* Supplements */}
          {plan.supplements?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-2">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Pill className="h-4 w-4" /> {t("supplements")}
              </h4>
              <div className="space-y-2">
                {plan.supplements.map((s: any, i: number) => (
                  <div key={i} className="rounded-lg bg-muted/30 p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.dosage} · {s.timing}</p>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                    {s.warning && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {s.warning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Variation */}
          {plan.weeklyVariation && (
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
              <h4 className="font-semibold text-sm text-foreground mb-2">{t("weeklyVariation")}</h4>
              <p className="text-xs text-muted-foreground">{plan.weeklyVariation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
