import { useNavigate } from "react-router-dom";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { MentalLibrary } from "@/components/MentalLibrary";
import { useState } from "react";
import { Dumbbell, Brain, UtensilsCrossed, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type LibraryTab = "exercise" | "mental" | "nutrition";

export default function Library() {
  const [tab, setTab] = useState<LibraryTab>("exercise");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold text-foreground">Library</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setTab("exercise")}
            data-active={tab === "exercise"}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
              data-[active=true]:bg-card data-[active=true]:text-tab-plan data-[active=true]:shadow-sm
              data-[active=false]:text-muted-foreground"
          >
            <Dumbbell className="h-4 w-4" />
            Exercises
          </button>
          <button
            onClick={() => setTab("mental")}
            data-active={tab === "mental"}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
              data-[active=true]:bg-card data-[active=true]:text-tab-mental data-[active=true]:shadow-sm
              data-[active=false]:text-muted-foreground"
          >
            <Brain className="h-4 w-4" />
            Mental
          </button>
          <button
            onClick={() => setTab("nutrition")}
            data-active={tab === "nutrition"}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
              data-[active=true]:bg-card data-[active=true]:text-tab-nutrition data-[active=true]:shadow-sm
              data-[active=false]:text-muted-foreground"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Nutrition
          </button>
        </div>

        {tab === "exercise" && <ExerciseLibrary />}
        {tab === "mental" && <MentalLibrary />}
        {tab === "nutrition" && (
          <div className="text-center py-12 text-muted-foreground">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 text-tab-nutrition" />
            <p className="font-semibold">Nutrition & Recipes</p>
            <p className="text-sm mt-1">Coming soon — meal plans, recipes, and nutrition guides for athletes.</p>
          </div>
        )}
      </main>
    </div>
  );
}
