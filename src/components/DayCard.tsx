import { type TrainingDay } from "@/data/exercises";
import { cn } from "@/lib/utils";
import { Dumbbell, Shield, Battery } from "lucide-react";

const TYPE_CONFIG = {
  tkd: { icon: Shield, accent: "border-primary" },
  gym: { icon: Dumbbell, accent: "border-accent" },
  recovery: { icon: Battery, accent: "border-speed" },
};

interface DayCardProps {
  day: TrainingDay;
  isSelected: boolean;
  onClick: () => void;
}

export function DayCard({ day, isSelected, onClick }: DayCardProps) {
  const config = TYPE_CONFIG[day.type];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all duration-200",
        "hover:bg-secondary/50 cursor-pointer",
        isSelected
          ? `${config.accent} bg-secondary`
          : "border-border bg-card"
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {day.dayOfWeek.slice(0, 3)}
      </span>
      <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
      <span className="text-[10px] font-medium text-card-foreground text-center leading-tight">
        {day.label}
      </span>
    </button>
  );
}
