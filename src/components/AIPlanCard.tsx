import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Dumbbell, Battery } from "lucide-react";

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

const TYPE_BADGES: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  tkd: { label: "Taekwondo", className: "bg-gradient-energy", icon: Shield },
  gym: { label: "Gym Session", className: "bg-gradient-power", icon: Dumbbell },
  recovery: { label: "Recovery", className: "bg-speed/20 text-speed", icon: Battery },
};

interface AIPlanCardProps {
  plan: {
    id: string;
    name: string;
    plan_data: any;
    created_at: string;
  };
}

export function AIPlanCard({ plan }: AIPlanCardProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const schedule = plan.plan_data?.weeklySchedule || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
          <p className="text-xs text-muted-foreground">Generated {new Date(plan.created_at).toLocaleDateString()}</p>
        </div>
        <span className="text-xs bg-speed/20 text-speed px-2 py-1 rounded-full font-semibold">Active</span>
      </div>

      {/* Week overview */}
      <div className="grid grid-cols-7 gap-2">
        {schedule.map((day: any, i: number) => {
          const config = TYPE_BADGES[day.type] || TYPE_BADGES.gym;
          const Icon = config.icon;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(selectedDay === i ? null : i)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-all cursor-pointer hover:bg-secondary/50 ${
                selectedDay === i ? "border-primary bg-secondary" : "border-border bg-card"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day.dayOfWeek?.slice(0, 3)}
              </span>
              <Icon className={`h-4 w-4 ${selectedDay === i ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[9px] font-medium text-foreground text-center leading-tight">
                {day.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day detail */}
      {selectedDay !== null && schedule[selectedDay] && (
        <div className="animate-slide-up rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <h3 className="font-bold text-foreground">{schedule[selectedDay].dayOfWeek} — {schedule[selectedDay].label}</h3>
            {schedule[selectedDay].focus && (
              <p className="text-sm text-muted-foreground">{schedule[selectedDay].focus}</p>
            )}
          </div>

          {schedule[selectedDay].exercises?.length > 0 ? (
            <div className="space-y-2">
              {schedule[selectedDay].exercises.map((ex: any, j: number) => (
                <AIExerciseRow key={j} exercise={ex} index={j + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Follow your dojang's programming for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AIExerciseRow({ exercise, index }: { exercise: any; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[exercise.category] || "bg-muted"}`} />
        <span className="font-semibold text-sm text-foreground flex-1 text-left">{exercise.name}</span>
        <span className="text-xs text-muted-foreground mr-2">
          {exercise.sets}×{exercise.reps}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-slide-up">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Coaching: </span>
            {exercise.coachingCue}
          </p>
          <p className="text-xs text-primary/80">
            <span className="font-semibold text-primary">Why for TKD: </span>
            {exercise.whyItMatters}
          </p>
        </div>
      )}
    </div>
  );
}
