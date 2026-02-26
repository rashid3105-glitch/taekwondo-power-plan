import { useState } from "react";
import { WeeklyPlan } from "@/components/WeeklyPlan";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { Zap, BookOpen, Target, AlertTriangle } from "lucide-react";

type Tab = "plan" | "library";

const Index = () => {
  const [tab, setTab] = useState<Tab>("plan");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-energy flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-foreground">TKD POWER</h1>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Performance Training System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Philosophy banner */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-sm text-foreground mb-1">Training Philosophy</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This program prioritizes <span className="text-primary font-semibold">speed, rate of force development, and explosiveness</span> while 
                building lean muscle that enhances — never hinders — your taekwondo. Gym sessions are strategically placed 
                around your TKD schedule to maximize recovery. Heavy sessions stay low-rep to build neural drive without excessive hypertrophy.
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-accent">Key rule:</span> Never grind reps. If bar speed drops or form breaks, 
            stop the set. We're training the nervous system, not chasing fatigue. Leave 1-2 reps in reserve on every set.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setTab("plan")}
            data-active={tab === "plan"}
            className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer
              data-[active=true]:bg-card data-[active=true]:text-foreground data-[active=true]:shadow-sm
              data-[active=false]:text-muted-foreground"
          >
            <Zap className="h-4 w-4" />
            Weekly Plan
          </button>
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
        </div>

        {/* Content */}
        {tab === "plan" ? <WeeklyPlan /> : <ExerciseLibrary />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <p className="text-center text-xs text-muted-foreground">
          Built for taekwondo athletes. Train fast, stay fast.
        </p>
      </footer>
    </div>
  );
};

export default Index;
