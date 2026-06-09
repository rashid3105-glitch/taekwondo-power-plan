import { type TrainingDay } from "@/data/exercises";
import { ExerciseCard } from "./ExerciseCard";
import { Shield, Dumbbell, Battery } from "lucide-react";

const TYPE_BADGES: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  tkd: { label: "Taekwondo", className: "bg-gradient-energy", icon: Shield },
  gym: { label: "Gym Session", className: "bg-gradient-power", icon: Dumbbell },
  recovery: { label: "Recovery", className: "bg-speed/20 text-speed", icon: Battery },
};

export function DayDetail({ day }: { day: TrainingDay }) {
  const badge = TYPE_BADGES[day.type];
  const Icon = badge.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3 mb-1">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badge.className}`}>
          <Icon className="h-3 w-3" />
          {badge.label}
        </span>
        <h3 className="text-lg font-bold text-card-foreground">{day.dayOfWeek}</h3>
      </div>
      {day.focus && (
        <p className="text-sm text-muted-foreground mb-6">{day.focus}</p>
      )}

      {day.exercises.length > 0 ? (
        <div className="space-y-3">
          {day.exercises.map((exercise, i) => (
            <ExerciseCard key={exercise.id} exercise={exercise} index={i + 1} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {day.type === "tkd"
              ? "Follow your dojang's programming. Gym work is scheduled around your TKD sessions."
              : "Light movement, foam rolling, stretching. Listen to your body."}
          </p>
        </div>
      )}
    </div>
  );
}
