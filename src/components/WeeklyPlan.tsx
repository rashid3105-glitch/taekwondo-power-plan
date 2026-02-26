import { useState } from "react";
import { WEEKLY_PLAN, type TrainingDay } from "@/data/exercises";
import { DayCard } from "./DayCard";
import { DayDetail } from "./DayDetail";

export function WeeklyPlan() {
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null);

  return (
    <div className="space-y-6">
      {/* Week overview */}
      <div className="grid grid-cols-7 gap-2">
        {WEEKLY_PLAN.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            isSelected={selectedDay?.id === day.id}
            onClick={() => setSelectedDay(selectedDay?.id === day.id ? null : day)}
          />
        ))}
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div className="animate-slide-up">
          <DayDetail day={selectedDay} />
        </div>
      )}
    </div>
  );
}
