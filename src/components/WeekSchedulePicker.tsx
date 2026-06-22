import { Shield, Dumbbell, Battery, Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TYPES = [
  { value: "tkd" as const, label: "TKD", icon: Shield, color: "text-primary", border: "border-primary/50", bg: "bg-primary/10" },
  { value: "gym" as const, label: "Gym", icon: Dumbbell, color: "text-accent", border: "border-accent/50", bg: "bg-accent/10" },
  { value: "selftraining" as const, label: "Self", icon: User, color: "text-self", border: "border-self/50", bg: "bg-self/10" },
  { value: "rest" as const, label: "Rest", icon: Battery, color: "text-speed", border: "border-speed/50", bg: "bg-speed/10" },
];

export type SessionType = "tkd" | "gym" | "rest" | "selftraining";
export type DaySession = { type: SessionType };
export type DaySchedule = { day: string; type: SessionType; sessions?: DaySession[] };

function getDaySessions(schedule: DaySchedule[], day: string): DaySession[] {
  const entry = schedule.find((s) => s.day === day);
  if (!entry) return [{ type: "rest" }];
  if (entry.sessions && entry.sessions.length > 0) return entry.sessions;
  return [{ type: entry.type }];
}

interface WeekSchedulePickerProps {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
}

export function WeekSchedulePicker({ schedule, onChange }: WeekSchedulePickerProps) {
  const cycleSession = (day: string, sessionIndex: number) => {
    const sessions = [...getDaySessions(schedule, day)];
    const order: SessionType[] = ["tkd", "gym", "selftraining", "rest"];
    sessions[sessionIndex] = {
      type: order[(order.indexOf(sessions[sessionIndex].type) + 1) % order.length],
    };
    updateDay(day, sessions);
  };

  const addSession = (day: string) => {
    const sessions = [...getDaySessions(schedule, day)];
    if (sessions.length >= 3) return; // max 3 sessions per day
    sessions.push({ type: "tkd" });
    updateDay(day, sessions);
  };

  const removeSession = (day: string, sessionIndex: number) => {
    const sessions = [...getDaySessions(schedule, day)];
    if (sessions.length <= 1) return;
    sessions.splice(sessionIndex, 1);
    updateDay(day, sessions);
  };

  const updateDay = (day: string, sessions: DaySession[]) => {
    const newSchedule = schedule.map((s) =>
      s.day === day
        ? { ...s, type: sessions[0].type, sessions }
        : s
    );
    // If the day doesn't exist yet, add it
    if (!newSchedule.find((s) => s.day === day)) {
      newSchedule.push({ day, type: sessions[0].type, sessions });
    }
    onChange(newSchedule);
  };

  const hasRest = schedule.some((s) => {
    const sessions = getDaySessions(schedule, s.day);
    return sessions.some((sess) => sess.type === "rest");
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {DAYS.map((day) => {
          const sessions = getDaySessions(schedule, day);
          return (
            <div key={day} className="flex flex-col gap-1">
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
                {day.slice(0, 3)}
              </span>
              {sessions.map((sess, si) => {
                const config = TYPES.find((t) => t.value === sess.type)!;
                const Icon = config.icon;
                return (
                  <div key={si} className="relative group">
                    <button
                      type="button"
                      onClick={() => cycleSession(day, si)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg border-2 p-1.5 sm:p-2 transition-all cursor-pointer w-full",
                        config.border, config.bg
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", config.color)} />
                      <span className={cn("text-[8px] sm:text-[9px] font-bold uppercase", config.color)}>
                        {config.label}
                      </span>
                    </button>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSession(day, si)}
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {sessions.length < 3 && !sessions.some((s) => s.type === "rest") && (
                <button
                  type="button"
                  onClick={() => addSession(day)}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-1 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!hasRest && (
        <p className="text-[11px] text-destructive font-medium">⚠ Include at least one rest day for recovery</p>
      )}

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> TKD</span>
        <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3 text-accent" /> Gym</span>
        <span className="flex items-center gap-1"><User className="h-3 w-3 text-self" /> Self</span>
        <span className="flex items-center gap-1"><Battery className="h-3 w-3 text-speed" /> Rest</span>
        <span className="ml-auto italic">Tap to cycle · + to add session</span>
      </div>
    </div>
  );
}
