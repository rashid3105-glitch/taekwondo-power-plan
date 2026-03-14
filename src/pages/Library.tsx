import { useNavigate, useParams } from "react-router-dom";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { MentalLibrary } from "@/components/MentalLibrary";
import { NutritionLibrary } from "@/components/NutritionLibrary";
import { Dumbbell, Brain, UtensilsCrossed, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITLES: Record<string, string> = {
  exercise: "Exercises",
  mental: "Mental Training",
  nutrition: "Nutrition & Recipes",
};

const ICONS: Record<string, typeof Dumbbell> = {
  exercise: Dumbbell,
  mental: Brain,
  nutrition: UtensilsCrossed,
};

const COLORS: Record<string, string> = {
  exercise: "text-primary",
  mental: "text-tab-mental",
  nutrition: "text-tab-nutrition",
};

export default function Library() {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const Icon = ICONS[section || ""] || BookOpen;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/library")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${COLORS[section || ""] || "text-primary"}`} />
            <span className="text-base font-extrabold text-foreground">{TITLES[section || ""] || "Library"}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {section === "exercise" && <ExerciseLibrary />}
        {section === "mental" && <MentalLibrary />}
        {section === "nutrition" && <NutritionLibrary />}
      </main>
    </div>
  );
}
