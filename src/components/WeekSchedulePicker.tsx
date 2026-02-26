import { Shield, Dumbbell, Battery } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TYPES = [
  { value: "tkd", label: "TKD", icon: Shield, color: "text-primary" },
  { value: "gym", label: "Gym", icon: Dumbbell, color: "text-accent" },
  { value: "rest", label: "Rest", icon: Battery, color: "text-speed" },
] as const;

export type DaySchedule = { day: string; type: "tkd" | "gym" | "rest" };

interface WeekSchedulePickerProps {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
}

export function WeekSchedulePicker({ schedule, onChange }: WeekSchedulePickerProps) {
  const getType = (day: string) => schedule.find((s) => s.day === day)?.type || "rest";

  const cycleType = (day: string) => {
    const current = getType(day);
    const order: Array<"tkd" | "gym" | "rest"> = ["tkd", "gym", "rest"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    onChange(schedule.map((s) => (s.day === day ? { ...s, type: next } : s)));
  };

  const hasRest = schedule.some((s) => s.type === "rest");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS.map((day) => {
          const type = getType(day);
          const config = TYPES.find((t) => t.value === type)!;
          const Icon = config.icon;
          return (
            <button
              key={day}
              type="button"
              onClick={() => cycleType(day)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border-2 p-2 sm:p-3 transition-all cursor-pointer",
                type === "tkd" && "border-primary/50 bg-primary/10",
                type === "gym" && "border-accent/50 bg-accent/10",
                type === "rest" && "border-speed/50 bg-speed/10"
              )}
            >
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day.slice(0, 3)}
              </span>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", config.color)} />
              <span className={cn("text-[9px] sm:text-[10px] font-bold uppercase", config.color)}>
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {!hasRest && (
        <p className="text-[11px] text-destructive font-medium">⚠ Include at least one rest day for recovery</p>
      )}

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> TKD</span>
        <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3 text-accent" /> Gym</span>
        <span className="flex items-center gap-1"><Battery className="h-3 w-3 text-speed" /> Rest</span>
        <span className="ml-auto italic">Tap to cycle</span>
      </div>
    </div>
  );
}
