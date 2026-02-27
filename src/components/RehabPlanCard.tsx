import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASE_COLORS: Record<number, string> = {
  0: "border-destructive/40 bg-destructive/5",
  1: "border-accent/40 bg-accent/5",
  2: "border-primary/40 bg-primary/5",
  3: "border-speed/40 bg-speed/5",
};

const PHASE_DOT: Record<number, string> = {
  0: "bg-destructive",
  1: "bg-accent",
  2: "bg-primary",
  3: "bg-speed",
};

interface RehabPlanCardProps {
  plan: any;
}

export function RehabPlanCard({ plan }: RehabPlanCardProps) {
  const [openPhase, setOpenPhase] = useState<number | null>(0);

  if (!plan) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">{plan.rehabPlanName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estimated recovery: ~{plan.estimatedWeeks} weeks
            </p>
            {plan.injurySummary && (
              <p className="text-sm text-muted-foreground mt-2">{plan.injurySummary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Important notes */}
      {plan.importantNotes?.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">Safety Notes</span>
          </div>
          <ul className="space-y-1">
            {plan.importantNotes.map((note: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-2">
        {plan.phases?.map((phase: any, i: number) => (
          <div key={i} className={cn("rounded-xl border overflow-hidden transition-all", PHASE_COLORS[i] || "border-border bg-card")}>
            <button
              onClick={() => setOpenPhase(openPhase === i ? null : i)}
              className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              <span className={cn("h-3 w-3 rounded-full flex-shrink-0", PHASE_DOT[i] || "bg-muted")} />
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">{phase.phase}</p>
                <p className="text-xs text-muted-foreground">Weeks {phase.weeks} · {phase.goal}</p>
              </div>
              {openPhase === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {openPhase === i && (
              <div className="px-4 pb-4 space-y-3 animate-slide-up">
                {/* Progression criteria */}
                {phase.criteria && (
                  <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-0.5">Progress when:</p>
                      <p className="text-xs text-foreground">{phase.criteria}</p>
                    </div>
                  </div>
                )}

                {/* Exercises */}
                {phase.exercises?.map((ex: any, j: number) => (
                  <RehabExerciseRow key={j} exercise={ex} index={j + 1} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RehabExerciseRow({ exercise, index }: { exercise: any; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className="font-semibold text-sm flex-1 text-left text-foreground">{exercise.name}</span>
        <span className="text-xs text-muted-foreground">{exercise.sets}×{exercise.reps}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-md bg-muted p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Coaching: </span>{exercise.coachingCue}
          </p>
          <p className="text-xs text-primary/80">
            <span className="font-semibold text-primary">Why: </span>{exercise.whyItMatters}
          </p>
          {exercise.painGuideline && (
            <div className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{exercise.painGuideline}</span>
            </div>
          )}
          {exercise.progressionTip && (
            <p className="text-xs text-accent">
              <span className="font-semibold">Progression: </span>{exercise.progressionTip}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
