import { useEffect, useState, useCallback } from "react";
import { Trash2, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MealLog {
  id: string;
  meal_name: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
}

interface Props {
  /** Daily calorie target, e.g. profile.custom_calories or plan.dailyCalorieEstimate */
  calorieTarget?: number | null;
  /** Macro target grams */
  proteinTarget?: number | null;
  carbsTarget?: number | null;
  fatTarget?: number | null;
  /** Bump this to force refresh */
  refreshKey?: number;
}

function Ring({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-muted" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          className="fill-none stroke-tab-nutrition transition-all"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-foreground leading-none">{Math.round(value)}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">
          {Math.round(value)}{max > 0 ? `/${Math.round(max)}` : ""}g
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DailyNutritionDashboard({
  calorieTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
  refreshKey = 0,
}: Props) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await (supabase.from as any)("nutrition_logs")
        .select("id, meal_name, calories, protein_g, carbs_g, fat_g, logged_at")
        .eq("user_id", user.id)
        .eq("date", today)
        .order("logged_at", { ascending: true });
      if (error) throw error;
      setLogs((data as MealLog[]) || []);
    } catch (e) {
      console.error("load nutrition_logs", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const totals = logs.reduce(
    (acc, l) => ({
      cal: acc.cal + (Number(l.calories) || 0),
      p: acc.p + (Number(l.protein_g) || 0),
      c: acc.c + (Number(l.carbs_g) || 0),
      f: acc.f + (Number(l.fat_g) || 0),
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  const calTarget = calorieTarget || 0;

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from as any)("nutrition_logs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast.success(t("deleteMeal") || "Slettet");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center gap-4">
        <Ring value={totals.cal} max={calTarget || Math.max(totals.cal, 1)} label="kcal" />
        <div className="flex-1 space-y-2 min-w-0">
          <Bar label={t("protein") || "Protein"} value={totals.p} max={proteinTarget || 0} color="bg-red-400" />
          <Bar label={t("carbs") || "Kulhydrater"} value={totals.c} max={carbsTarget || 0} color="bg-amber-400" />
          <Bar label={t("fat") || "Fedt"} value={totals.f} max={fatTarget || 0} color="bg-purple-400" />
        </div>
      </div>

      {calTarget > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("dailyTarget") || "Dagligt mål"}: <span className="font-semibold text-foreground">{calTarget} kcal</span></span>
          <span>{t("remaining") || "Tilbage"}: <span className="font-semibold text-foreground">{Math.max(0, calTarget - totals.cal)} kcal</span></span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-tab-nutrition" />
          <h4 className="text-sm font-semibold text-foreground">{t("todayMeals") || "Dagens måltider"}</h4>
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground">…</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("noMealsToday") || "Ingen måltider logget i dag"}</p>
        ) : (
          <ul className="space-y-1.5">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{l.meal_name || "—"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round(Number(l.calories) || 0)} kcal · {Math.round(Number(l.protein_g) || 0)}g protein
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={t("deleteMeal") || "Slet"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
