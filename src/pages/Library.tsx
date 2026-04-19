import { useNavigate, useParams } from "react-router-dom";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { MentalLibrary } from "@/components/MentalLibrary";
import { NutritionLibrary } from "@/components/NutritionLibrary";
import { TestLibrary } from "@/components/TestLibrary";
import { Dumbbell, Brain, UtensilsCrossed, ClipboardList, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const TITLE_KEYS: Record<string, TranslationKey> = {
  exercise: "exercisesTitle",
  mental: "hubMentalTitle",
  nutrition: "hubNutritionTitle",
  testing: "libTestingLabel",
};

const ICONS: Record<string, typeof Dumbbell> = {
  exercise: Dumbbell,
  mental: Brain,
  nutrition: UtensilsCrossed,
  testing: ClipboardList,
};

const COLORS: Record<string, string> = {
  exercise: "text-primary",
  mental: "text-tab-mental",
  nutrition: "text-tab-nutrition",
  testing: "text-primary",
};

export default function Library() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const Icon = ICONS[section || ""] || BookOpen;
  const titleKey = TITLE_KEYS[section || ""];

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
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
        {section === "nutrition" && <NutritionLibrary />}
        {section === "testing" && <TestLibrary />}
      </main>
      <AppFooter />
    </div>
  );
}
