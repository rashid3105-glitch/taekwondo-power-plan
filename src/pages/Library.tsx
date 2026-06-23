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
import { SupplementChecker } from "@/components/SupplementChecker";
import { DrillLibrary } from "@/components/DrillLibrary";
import { Dumbbell, Brain, UtensilsCrossed, ClipboardList, ArrowLeft, BookOpen, Zap, ChefHat, Camera, ShieldCheck, Swords } from "lucide-react";
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
  supplement: "libSupplementLabel",
  drills: "drillsTitle",
};

const ICONS: Record<string, typeof Dumbbell> = {
  exercise: Dumbbell,
  mental: Brain,
  nutrition: UtensilsCrossed,
  testing: ClipboardList,
  hiit: Zap,
  supplement: ShieldCheck,
  drills: Swords,
};

const COLORS: Record<string, string> = {
  exercise: "text-primary",
  mental: "text-tab-mental",
  nutrition: "text-tab-nutrition",
  testing: "text-primary",
  hiit: "text-destructive",
  supplement: "text-emerald-500",
  drills: "text-amber-500",
};

type NutritionView = "home" | "planner" | "logger" | "recipes";

export default function Library({ forcedSection }: { forcedSection?: string } = {}) {
  const { section: paramSection } = useParams<{ section: string }>();
  const section = forcedSection ?? paramSection;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const Icon = ICONS[section || ""] || BookOpen;
  const titleKey = TITLE_KEYS[section || ""];

  const [nutritionView, setNutritionView] = useState<NutritionView>("home");
  const [profile, setProfile] = useState<any>(null);
  const [loggerRefresh, setLoggerRefresh] = useState(0);

  useEffect(() => {
    if (section !== "nutrition") return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("age, weight_kg, belt_level, discipline, tkd_sessions_per_week, experience_years, current_injury, custom_calories, birth_date")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data && data.age == null && data.birth_date) {
        const bd = new Date(data.birth_date);
        const today = new Date();
        let a = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
        if (a > 0) data.age = a;
      }
      setProfile(data);
    })();
  }, [section]);

  const nutritionCards = [
    {
      key: "planner" as const,
      label: t("libNutritionPlannerLabel") || "Kostplanlægger",
      desc: t("libNutritionPlannerDesc") || "Din personlige kostplan",
      icon: ChefHat,
      color: "text-emerald-500",
    },
    {
      key: "logger" as const,
      label: t("libNutritionLoggerLabel") || "Madregistrering",
      desc: t("libNutritionLoggerDesc") || "Scan og log dine måltider",
      icon: Camera,
      color: "text-tab-nutrition",
    },
    {
      key: "recipes" as const,
      label: t("libNutritionRecipesLabel") || "Opskrifter",
      desc: t("libNutritionRecipesDesc") || "Sund mad tilpasset taekwondo-atleter",
      icon: BookOpen,
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
            <span className="text-base font-extrabold text-card-foreground">
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
        {section === "supplement" && <SupplementChecker />}
        {section === "drills" && <DrillLibrary />}

        {section === "nutrition" && nutritionView === "home" && (
          <div className="grid gap-4">
            {nutritionCards.map((c) => (
              <button
                key={c.key}
                onClick={() => setNutritionView(c.key)}
                className="flex items-center gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer text-left"
              >
                <div className="h-12 w-12 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-center shrink-0">
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                </div>
                <div>
                  <div className="font-bold text-zinc-100 text-base">{c.label}</div>
                  <div className="text-sm text-zinc-400">{c.desc}</div>
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
