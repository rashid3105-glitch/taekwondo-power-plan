import { useState } from "react";
import { type Exercise, CATEGORY_LABELS } from "@/data/exercises";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MuscleGroupBadges } from "./MuscleIcon";
import { ExerciseIllustration } from "./ExerciseIllustration";

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className={cn("h-2 w-2 rounded-full flex-shrink-0", CATEGORY_DOT[exercise.category])} />
        <span className="font-semibold text-sm text-foreground flex-1 text-left">{exercise.name}</span>
        <MuscleGroupBadges muscles={exercise.muscleGroups} size={26} />
        <span className="text-xs text-muted-foreground mr-2">
          {exercise.sets}×{exercise.reps}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline px-2 py-0.5 rounded bg-muted">
          {CATEGORY_LABELS[exercise.category]}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 animate-slide-up">
          {/* Exercise illustration */}
          <ExerciseIllustration exercise={exercise} />

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>

          {/* Why it matters */}
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-primary/80">
              <span className="font-semibold text-primary">Why it matters for TKD: </span>
              {exercise.whyItMatters}
            </p>
          </div>

          {/* Alternatives */}
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Alternatives</p>
              {exercise.alternatives.map((alt, k) => (
                <p key={k} className="text-xs text-foreground">
                  <span className="font-semibold">{alt.name}</span>
                  <span className="text-muted-foreground"> — {alt.reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
