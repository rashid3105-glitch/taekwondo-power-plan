import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { MentalLibrary } from "@/components/MentalLibrary";
import { NutritionLibrary } from "@/components/NutritionLibrary";
import { NutritionPlan } from "@/components/NutritionPlan";
import { FoodScanner } from "@/components/FoodScanner";
import { DailyNutritionDashboard } from "@/components/DailyNutritionDashboard";
import { TestLibrary } from "@/components/TestLibrary";
import { HiitLibrary } from "@/components/HiitLibrary";
import { Dumbbell, Brain, UtensilsCrossed, ClipboardList, ArrowLeft, BookOpen, Zap, ChefHat, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { TranslationKey } from "@/i18n/translations";

const TITLE_KEYS: Record<string, TranslationKey> = {
  exercise: "exercisesTitle",
  mental: "hubMentalTitle",
  nutrition: "hubNutritionTitle",
  testing: "libTestingLabel",
  hiit: "libHiitLabel",
};

const ICONS: Record<string, typeof Dumbbell> = {
  exercise: Dumbbell,
  mental: Brain,
  nutrition: UtensilsCrossed,
  testing: ClipboardList,
  hiit: Zap,
};

const COLORS: Record<string, string> = {
  exercise: "text-primary",
  mental: "text-tab-mental",
  nutrition: "text-tab-nutrition",
  testing: "text-primary",
  hiit: "text-destructive",
};

type NutritionView = "home" | "planner" | "logger" | "recipes";

export default function Library() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const Icon = ICONS[section || ""] || BookOpen;
  const titleKey = TITLE_KEYS[section || ""];

  const [nutritionView, setNutritionView] = useState<NutritionView>("home");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (section !== "nutrition") return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("age, weight_kg, belt_level, discipline, tkd_sessions_per_week, experience_years, current_injury, custom_calories")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
    })();
  }, [section]);

  const nutritionCards = [
    {
      key: "planner" as const,
      label: t("libNutritionPlannerLabel") || "Kostplanlægger",
      desc: t("libNutritionPlannerDesc") || "Din personlige kostplan",
      icon: ChefHat,
      bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
      color: "text-emerald-500",
    },
    {
      key: "logger" as const,
      label: t("libNutritionLoggerLabel") || "Madregistrering",
      desc: t("libNutritionLoggerDesc") || "Scan og log dine måltider",
      icon: Camera,
      bg: "bg-tab-nutrition/10 border-tab-nutrition/20 hover:border-tab-nutrition/40",
      color: "text-tab-nutrition",
    },
    {
      key: "recipes" as const,
      label: t("libNutritionRecipesLabel") || "Opskrifter",
      desc: t("libNutritionRecipesDesc") || "Sund mad tilpasset taekwondo-atleter",
      icon: BookOpen,
      bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40",
      color: "text-amber-500",
    },
  ];

  const onHeaderBack = () => {
    if (section === "nutrition" && nutritionView !== "home") {
      setNutritionView("home");
    } else {
      navigate("/library");
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onHeaderBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${COLORS[section || ""] || "text-primary"}`} />
            <span className="text-base font-extrabold text-foreground">
              {titleKey ? t(titleKey) : t("library")}
            </span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {section === "exercise" && <ExerciseLibrary />}
        {section === "mental" && <MentalLibrary />}
        {section === "testing" && <TestLibrary />}
        {section === "hiit" && <HiitLibrary />}

        {section === "nutrition" && nutritionView === "home" && (
          <div className="grid gap-4">
            {nutritionCards.map((c) => (
              <button
                key={c.key}
                onClick={() => setNutritionView(c.key)}
                className={`flex items-center gap-4 p-5 rounded-xl border transition-all cursor-pointer text-left ${c.bg}`}
              >
                <div className="h-12 w-12 rounded-lg bg-card flex items-center justify-center shrink-0">
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                </div>
                <div>
                  <div className="font-bold text-foreground text-base">{c.label}</div>
                  <div className="text-sm text-muted-foreground">{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {section === "nutrition" && nutritionView === "planner" && (
          <div className="space-y-4">
            <DailyNutritionDashboard calorieTarget={profile?.custom_calories ?? null} />
            <NutritionPlan profile={profile} />
          </div>
        )}
        {section === "nutrition" && nutritionView === "logger" && (
          <div className="space-y-4">
            <DailyNutritionDashboard
              key={loggerRefresh}
              calorieTarget={profile?.custom_calories ?? null}
              refreshKey={loggerRefresh}
            />
            <FoodScanner onLogged={() => setLoggerRefresh((n) => n + 1)} />
          </div>
        )}
        {section === "nutrition" && nutritionView === "recipes" && (
          <NutritionLibrary />
        )}
      </main>
      <AppFooter />
    </div>
  );
}
