import { useState } from "react";
import { getRecipes, RECIPE_CATEGORY_LABELS, RECIPE_CATEGORY_ICONS, type RecipeCategory } from "@/data/recipes";
import { RecipeCard } from "./RecipeCard";

const CATEGORIES: RecipeCategory[] = ["breakfast", "lunch", "dinner", "snack", "pre-workout", "post-workout"];

export function NutritionLibrary() {
  const [filter, setFilter] = useState<RecipeCategory | "all">("all");
  const recipes = getRecipes();

  const filtered = filter === "all" ? recipes : recipes.filter((r) => r.category === filter);

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
          All ({recipes.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            data-active={filter === cat}
            className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors cursor-pointer
              data-[active=true]:bg-tab-nutrition data-[active=true]:text-foreground
              data-[active=false]:text-muted-foreground hover:text-foreground"
          >
            {RECIPE_CATEGORY_ICONS[cat]} {RECIPE_CATEGORY_LABELS[cat]} ({recipes.filter((r) => r.category === cat).length})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((recipe, i) => (
          <RecipeCard key={recipe.id} recipe={recipe} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
