import { useState } from "react";
import { getMentalExercises, MENTAL_CATEGORY_LABELS, MENTAL_CATEGORY_ICONS, type MentalCategory } from "@/data/mentalExercises";
import { MentalExerciseCard } from "./MentalExerciseCard";
import { useLanguage } from "@/i18n/LanguageContext";
import { MENTAL_CATEGORY_STYLE } from "@/lib/mentalCategoryStyle";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES: MentalCategory[] = ["focus", "visualization", "breathing", "confidence", "recovery", "toughness"];

export function MentalLibrary() {
  const [filter, setFilter] = useState<MentalCategory | "all">("all");
  const [openCat, setOpenCat] = useState<MentalCategory | null>(null);
  const { locale, t } = useLanguage();
  const exercises = getMentalExercises(locale);

  const filtered = filter === "all" ? exercises : exercises.filter((e) => e.category === filter);
  const catLabels = MENTAL_CATEGORY_LABELS[locale];

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
        {CATEGORIES.map((cat) => {
          const catItems = filtered.filter((e) => e.category === cat);
          if (catItems.length === 0) return null;
          const isOpen = filter !== "all" || openCat === cat;
          const { Icon, tile, icon } = MENTAL_CATEGORY_STYLE[cat];
          return (
            <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent/30"
                onClick={() => setOpenCat(isOpen && filter === "all" ? null : cat)}
              >
                <span className={cn("shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-xl", tile)}>
                  <Icon className={cn("h-5 w-5", icon)} />
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="block text-sm font-bold text-card-foreground">
                    {catLabels[cat]}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {catItems.length}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/60">
                  {catItems.map((exercise, i) => (
                    <MentalExerciseCard key={exercise.id} exercise={exercise} index={i + 1} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
