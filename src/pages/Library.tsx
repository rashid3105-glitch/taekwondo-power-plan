import { useNavigate } from "react-router-dom";
import { WeeklyPlan } from "@/components/WeeklyPlan";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { useState } from "react";
import { Zap, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Library() {
  const [tab, setTab] = useState<"plan" | "library">("library");
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
            <span className="text-base font-extrabold text-foreground">Exercise Library</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setTab("library")}
            data-active={tab === "library"}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
              data-[active=true]:bg-card data-[active=true]:text-foreground data-[active=true]:shadow-sm
              data-[active=false]:text-muted-foreground"
          >
            <BookOpen className="h-4 w-4" />
            Exercise Library
          </button>
          <button
            onClick={() => setTab("plan")}
            data-active={tab === "plan"}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
              data-[active=true]:bg-card data-[active=true]:text-foreground data-[active=true]:shadow-sm
              data-[active=false]:text-muted-foreground"
          >
            <Zap className="h-4 w-4" />
            Sample Plan
          </button>
        </div>

        {tab === "library" ? <ExerciseLibrary /> : <WeeklyPlan />}
      </main>
    </div>
  );
}
