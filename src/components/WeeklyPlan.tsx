import { useState } from "react";
import { getWeeklyPlan, setExerciseLocale, type TrainingDay } from "@/data/exercises";
import { DayCard } from "./DayCard";
import { DayDetail } from "./DayDetail";
import { useLanguage } from "@/i18n/LanguageContext";

export function WeeklyPlan() {
  const { locale } = useLanguage();
  setExerciseLocale(locale);
  const weeklyPlan = getWeeklyPlan(locale);
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null);

  return (
    <div className="space-y-6">
      {/* Week overview */}
      <div className="grid grid-cols-7 gap-2">
        {weeklyPlan.map((day) => (
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
