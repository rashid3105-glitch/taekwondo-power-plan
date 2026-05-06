import { useState } from "react";
import { type Recipe, RECIPE_CATEGORY_ICONS } from "@/data/recipes";
import { ChevronDown, ChevronUp, Clock, Flame } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CATEGORY_IMAGES } from "@/data/recipeImages";

const CATEGORY_KEYS: Record<string, string> = {
  breakfast: "catBreakfast",
  lunch: "catLunch",
  dinner: "catDinner",
  snack: "catSnack",
  "pre-workout": "catPreWorkout",
  "post-workout": "catPostWorkout",
};

export function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className="text-base">{RECIPE_CATEGORY_ICONS[recipe.category]}</span>
        <span className="font-semibold text-sm text-foreground flex-1 text-left">{recipe.name}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Flame className="h-3 w-3" /> {recipe.calories} kcal
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 animate-slide-up">
          {/* Image */}
          <img
            src={recipe.imageUrl || CATEGORY_IMAGES[recipe.category]}
            alt={recipe.name}
            loading="lazy"
            className="w-full h-40 sm:h-48 object-cover rounded-md border border-border"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = CATEGORY_IMAGES[recipe.category];
            }}
          />

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {recipe.prepTime}</span>
            <span>{t(CATEGORY_KEYS[recipe.category])}</span>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: t("calories"), value: `${recipe.calories}`, unit: "kcal" },
              { label: t("protein"), value: `${recipe.protein}`, unit: "g" },
              { label: t("carbs"), value: `${recipe.carbs}`, unit: "g" },
              { label: t("recipeFat"), value: `${recipe.fat}`, unit: "g" },
            ].map((m) => (
              <div key={m.label} className="rounded-md bg-muted p-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold text-foreground">{m.value}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{m.unit}</span></p>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("recipeIngredients")}</p>
            <ul className="grid grid-cols-2 gap-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-xs text-foreground/90 flex items-start gap-1.5">
                  <span className="text-tab-nutrition mt-0.5">•</span> {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("recipeSteps")}</p>
            <ol className="space-y-1">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground/90">
                  <span className="font-bold text-tab-nutrition min-w-[16px]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Tip */}
          <p className="text-xs leading-relaxed text-tab-nutrition/80">
            <span className="font-semibold text-tab-nutrition">{t("recipeAthleteTip")} </span>
            {recipe.tip}
          </p>
        </div>
      )}
    </div>
  );
}
