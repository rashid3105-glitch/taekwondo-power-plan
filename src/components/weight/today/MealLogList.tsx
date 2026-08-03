import { Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface MealLog {
  id: string;
  meal_name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

interface Props {
  meals: MealLog[];
  canEdit: boolean;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function MealLogList({ meals, canEdit, onDelete, onAdd }: Props) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{t("wpdFoodLog")}</p>
        {canEdit && (
          <button onClick={onAdd} className="text-xs text-primary font-semibold flex items-center gap-1">
            <Plus className="h-3 w-3" />
            {t("wpdAddMeal")}
          </button>
        )}
      </div>

      {meals.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">{t("wpdNoMeals")}</p>
      ) : (
        <ul className="space-y-1.5">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{m.meal_name}</p>
                <p className="text-[11px] text-muted-foreground tabular-nums">
                  {Math.round(m.protein_g ?? 0)}P · {Math.round(m.carbs_g ?? 0)}K · {Math.round(m.fat_g ?? 0)}F
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums shrink-0">{Math.round(m.calories)}</span>
              {canEdit && (
                <button
                  onClick={() => onDelete(m.id)}
                  aria-label={t("wpdDeleteMeal")}
                  title={t("wpdDeleteMeal")}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
