import { useState } from "react";
import { getAllExercises, CATEGORY_LABELS, type ExerciseCategory } from "@/data/exercises";
import { ExerciseCard } from "./ExerciseCard";

const CATEGORIES: ExerciseCategory[] = ["power", "plyometric", "speed", "strength", "mobility"];

const FILTER_STYLES: Record<ExerciseCategory, string> = {
  power: "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
  plyometric: "data-[active=true]:bg-explosive data-[active=true]:text-foreground",
  speed: "data-[active=true]:bg-speed data-[active=true]:text-primary-foreground",
  strength: "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  mobility: "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
};

export function ExerciseLibrary() {
  const [filter, setFilter] = useState<ExerciseCategory | "all">("all");
  const allExercises = getAllExercises();

  const filtered = filter === "all" 
    ? allExercises 
    : allExercises.filter((e) => e.category === filter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          data-active={filter === "all"}
          className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
            data-[active=true]:bg-foreground data-[active=true]:text-background
            data-[active=false]:text-muted-foreground hover:text-foreground cursor-pointer"
        >
          All ({allExercises.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            data-active={filter === cat}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
              data-[active=false]:text-muted-foreground hover:text-foreground cursor-pointer
              ${FILTER_STYLES[cat]}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.map((exercise, i) => (
          <ExerciseCard key={exercise.id} exercise={exercise} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
