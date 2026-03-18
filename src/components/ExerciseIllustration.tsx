import { type Exercise } from "@/data/exercises";
import { MuscleGroupBadges } from "./MuscleIcon";
import { Dumbbell, Zap, Wind, Move, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG: Record<string, { icon: typeof Dumbbell; gradient: string; label: string }> = {
  power: { icon: Zap, gradient: "from-accent/20 to-accent/5", label: "POWER" },
  speed: { icon: Wind, gradient: "from-speed/20 to-speed/5", label: "SPEED" },
  strength: { icon: Dumbbell, gradient: "from-primary/20 to-primary/5", label: "STRENGTH" },
  mobility: { icon: Move, gradient: "from-accent/20 to-accent/5", label: "MOBILITY" },
  plyometric: { icon: Flame, gradient: "from-explosive/20 to-explosive/5", label: "PLYOMETRIC" },
};

function parseFormCues(notes: string): string[] {
  // Split notes into individual cues by splitting on ". " or " — " or ". "
  const parts = notes
    .split(/(?:\.\s+|\s—\s)/)
    .map(s => s.replace(/\.$/, "").trim())
    .filter(s => s.length > 5);
  return parts.slice(0, 4);
}

interface ExerciseIllustrationProps {
  exercise: Exercise;
}

export function ExerciseIllustration({ exercise }: ExerciseIllustrationProps) {
  const config = CATEGORY_CONFIG[exercise.category] || CATEGORY_CONFIG.strength;
  const Icon = config.icon;
  const cues = parseFormCues(exercise.notes);

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden bg-gradient-to-br border border-border/50",
      config.gradient
    )}>
      {/* Header band */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background/40 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{config.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-mono font-bold text-foreground">{exercise.sets}×{exercise.reps}</span>
          {exercise.tempo && (
            <>
              <span className="text-border">|</span>
              <span className="font-mono text-[11px]">{exercise.tempo}</span>
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-4">
        {/* Muscles visual */}
        <div className="flex items-center justify-center py-3">
          <MuscleGroupBadges muscles={exercise.muscleGroups} size={44} showLabels />
        </div>

        {/* Form cues */}
        {cues.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Key Form Cues</p>
            <div className="grid gap-1.5">
              {cues.map((cue, i) => (
                <div key={i} className="flex items-start gap-2 bg-background/50 rounded-md px-3 py-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-foreground/90 leading-relaxed">{cue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
