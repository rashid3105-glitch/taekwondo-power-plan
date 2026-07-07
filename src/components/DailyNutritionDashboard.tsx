import { useEffect, useState, useCallback } from "react";
import { Trash2, Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MealItem {
  name: string;
  portion_g?: number | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

interface MealLog {
  id: string;
  meal_name: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_at: string;
  image_url: string | null;
  items: MealItem[] | null;
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
        <span className="text-lg font-extrabold text-card-foreground leading-none">{Math.round(value)}</span>
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
        <span className="font-medium text-card-foreground tabular-nums">
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
  const [expandedId, setExpandedId] = useState<string | null>(null);


  const [calcOpen, setCalcOpen] = useState(false);
  const [calcWeight, setCalcWeight] = useState("");
  const [calcAge, setCalcAge] = useState("");
  const [calcGender, setCalcGender] = useState<"m" | "f">("m");
  const [calcActivity, setCalcActivity] = useState("moderate");
  const [calcGoal, setCalcGoal] = useState("maintain");
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const calculateTDEE = () => {
    const w = parseFloat(calcWeight);
    const a = parseFloat(calcAge);
    if (!w || !a) return;
    const bmr = calcGender === "m"
      ? 10 * w + 6.25 * 175 - 5 * a + 5
      : 10 * w + 6.25 * 165 - 5 * a - 161;
    const mult: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };
    const tdee = bmr * (mult[calcActivity] ?? 1.55);
    const adj: Record<string, number> = { cut: -300, maintain: 0, bulk: 300 };
    setCalcResult(Math.round(tdee + (adj[calcGoal] ?? 0)));
  };

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await (supabase.from as any)("nutrition_logs")
        .select("id, meal_name, calories, protein_g, carbs_g, fat_g, logged_at, image_url, items")
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
    const target = logs.find((l) => l.id === id);
    const { error } = await (supabase.from as any)("nutrition_logs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    // Best-effort cleanup of the storage object.
    if (target?.image_url) {
      const marker = "/meal-photos/";
      const idx = target.image_url.indexOf(marker);
      if (idx >= 0) {
        const path = target.image_url.slice(idx + marker.length);
        supabase.storage.from("meal-photos").remove([path]).catch(() => {});
      }
    }
    toast.success(t("deleteMeal") || "Slettet");
  };


  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      {/* Kalorieberegner */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setCalcOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-card-foreground hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🔥</span> Kalorieberegner (TDEE)
          </span>
          <span className="text-xs text-muted-foreground">{calcOpen ? "▲ Luk" : "▼ Åbn"}</span>
        </button>

        {calcOpen && (
          <div className="px-4 pb-4 border-t border-border space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Vægt (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="74"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Alder</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={calcAge}
                  onChange={(e) => setCalcAge(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="25"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[{ v: "m", l: "Mand" }, { v: "f", l: "Kvinde" }].map((g) => (
                <button
                  key={g.v}
                  type="button"
                  onClick={() => setCalcGender(g.v as "m" | "f")}
                  className={`py-2 rounded-md border text-xs font-medium transition-colors ${
                    calcGender === g.v ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {g.l}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Aktivitetsniveau</label>
              <select
                value={calcActivity}
                onChange={(e) => setCalcActivity(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="sedentary">Stillesiddende (ingen motion)</option>
                <option value="light">Let aktiv (1-3 dage/uge)</option>
                <option value="moderate">Moderat aktiv (3-5 dage/uge)</option>
                <option value="active">Meget aktiv (6-7 dage/uge)</option>
                <option value="very_active">Ekstremt aktiv (2x dagligt)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Mål</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: "cut", l: "Vægttab" }, { v: "maintain", l: "Vedligehold" }, { v: "bulk", l: "Muskelmasse" }].map((g) => (
                  <button
                    key={g.v}
                    type="button"
                    onClick={() => setCalcGoal(g.v)}
                    className={`py-2 rounded-md border text-xs font-medium transition-colors ${
                      calcGoal === g.v ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {g.l}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={calculateTDEE}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Beregn
            </button>

            {calcResult !== null && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                <div className="text-2xl font-black text-primary">{calcResult.toLocaleString("da-DK")} kcal</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Anbefalet dagligt kalorieindtag baseret på dine oplysninger
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  {[
                    { label: "Protein", g: Math.round((calcResult * 0.30) / 4), color: "text-blue-500" },
                    { label: "Kulhydrat", g: Math.round((calcResult * 0.45) / 4), color: "text-yellow-500" },
                    { label: "Fedt", g: Math.round((calcResult * 0.25) / 9), color: "text-orange-500" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-md bg-muted/50 p-2">
                      <div className={`text-sm font-bold ${m.color}`}>{m.g}g</div>
                      <div className="text-[10px] text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
          <span>{t("dailyTarget") || "Dagligt mål"}: <span className="font-semibold text-card-foreground">{calTarget} kcal</span></span>
          <span>{t("remaining") || "Tilbage"}: <span className="font-semibold text-card-foreground">{Math.max(0, calTarget - totals.cal)} kcal</span></span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-tab-nutrition" />
          <h4 className="text-sm font-semibold text-card-foreground">{t("todayMeals") || "Dagens måltider"}</h4>
        </div>
        {loading ? (
          <p className="text-xs text-muted-foreground">…</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">{t("noMealsToday") || "Ingen måltider logget i dag"}</p>
        ) : (
          <ul className="space-y-1.5">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2">
                {l.image_url ? (
                  <img
                    src={l.image_url}
                    alt={l.meal_name || ""}
                    loading="lazy"
                    className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground truncate">{l.meal_name || "—"}</p>
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
