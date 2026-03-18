import { useState } from "react";
import { getMentalExercises, MENTAL_CATEGORY_LABELS, MENTAL_CATEGORY_ICONS, type MentalCategory } from "@/data/mentalExercises";
import { MentalExerciseCard } from "./MentalExerciseCard";
import { useLanguage } from "@/i18n/LanguageContext";

const CATEGORIES: MentalCategory[] = ["focus", "visualization", "breathing", "confidence", "recovery", "toughness"];

export function MentalLibrary() {
  const [filter, setFilter] = useState<MentalCategory | "all">("all");
  const { locale, t } = useLanguage();
  const exercises = getMentalExercises(language);

  const filtered = filter === "all" ? exercises : exercises.filter((e) => e.category === filter);
  const catLabels = MENTAL_CATEGORY_LABELS[language];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          data-active={filter === "all"}
          className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors cursor-pointer
            data-[active=true]:bg-foreground data-[active=true]:text-background
            data-[active=false]:text-muted-foreground hover:text-foreground"
        >
          {t("allFilter")} ({exercises.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            data-active={filter === cat}
            className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors cursor-pointer
              data-[active=true]:bg-tab-mental data-[active=true]:text-foreground
              data-[active=false]:text-muted-foreground hover:text-foreground"
          >
            {MENTAL_CATEGORY_ICONS[cat]} {catLabels[cat]} ({exercises.filter((e) => e.category === cat).length})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((exercise, i) => (
          <MentalExerciseCard key={exercise.id} exercise={exercise} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
