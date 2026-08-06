import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { FoodScanner } from "@/components/FoodScanner";
import { CalorieRing } from "./CalorieRing";
import { MacroBars } from "./MacroBars";
import { WeightProgressBar } from "./WeightProgressBar";
import { MealLogList, type MealLog } from "./MealLogList";
import { macroTargets, todayISO, type WeightGoal } from "@/lib/weightPlanner";

interface Props {
  userId: string;
  goal: (WeightGoal & { id: string }) | null;
  currentWeight: number | null;
  dailyTargetKcal: number;
  readOnly?: boolean;
  weighIn: string;
  onWeighInChange: (v: string) => void;
  onWeighInSave: () => void;
  saving?: boolean;
}

const DAY = 86400000;

function shiftDate(iso: string, days: number): string {
  return new Date(new Date(`${iso}T00:00:00`).getTime() + days * DAY).toISOString().slice(0, 10);
}

export function DailyOverview({
  userId, goal, currentWeight, dailyTargetKcal, readOnly = false,
  weighIn, onWeighInChange, onWeighInSave, saving,
}: Props) {
  const { t, locale } = useLanguage();
  const [date, setDate] = useState(todayISO());
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [burned, setBurned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [weighOpen, setWeighOpen] = useState(false);
  const location = useLocation();

  // If the native WebView was killed while the camera was open, App.tsx restores
  // this route with a reopen flag — bring the meal log sheet back up.
  useEffect(() => {
    if ((location.state as any)?.reopenMealLog && !readOnly) {
      setScannerOpen(true);
      toast.info(t("wpdMealLogRestored") || "Prøv igen — billedet gik tabt da kameraet lukkede.");
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isToday = date === todayISO();


  const load = useCallback(async () => {
    setLoading(true);
    const [logRes, healthRes] = await Promise.all([
      supabase.from("nutrition_logs").select("id, meal_name, calories, protein_g, carbs_g, fat_g")
        .eq("user_id", userId).eq("date", date).order("created_at", { ascending: true }),
      supabase.from("wearable_daily_summary").select("active_energy_kcal")
        .eq("user_id", userId).eq("summary_date", date).maybeSingle(),
    ]);
    setMeals((logRes.data ?? []).map((m: any) => ({
      id: m.id, meal_name: m.meal_name ?? "", calories: Number(m.calories ?? 0),
      protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g,
    })));
    setBurned(Number((healthRes.data as any)?.active_energy_kcal ?? 0) || 0);
    setLoading(false);
  }, [userId, date]);

  useEffect(() => { void load(); }, [load]);

  const intake = useMemo(() => meals.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories ?? 0),
      protein_g: acc.protein_g + Number(m.protein_g ?? 0),
      carbs_g: acc.carbs_g + Number(m.carbs_g ?? 0),
      fat_g: acc.fat_g + Number(m.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  ), [meals]);

  const targets = useMemo(
    () => macroTargets(dailyTargetKcal, goal?.direction ?? null, currentWeight),
    [dailyTargetKcal, goal, currentWeight],
  );

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.from("nutrition_logs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setMeals((prev) => prev.filter((m) => m.id !== id));
    toast.success(t("wpdMealDeleted"));
  };

  const label = isToday
    ? t("wpdToday")
    : new Date(`${date}T00:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setDate(shiftDate(date, -1))} aria-label="-1" className="text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-xs uppercase tracking-widest font-bold">{label}</span>
        <button
          onClick={() => !isToday && setDate(shiftDate(date, 1))}
          aria-label="+1"
          disabled={isToday}
          className="text-muted-foreground hover:text-primary disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <Card className="p-5 space-y-5">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <CalorieRing goalKcal={dailyTargetKcal} intakeKcal={intake.calories} burnedKcal={burned} />
            <MacroBars targets={targets} intake={intake} />
          </>
        )}
      </Card>

      <WeightProgressBar
        goal={goal}
        currentWeight={currentWeight}
        onAdd={() => (readOnly ? undefined : setWeighOpen(true))}
      />

      <Card className="p-4">
        <MealLogList
          meals={meals}
          canEdit={!readOnly && isToday}
          onDelete={deleteMeal}
          onAdd={() => setScannerOpen(true)}
        />
      </Card>

      <Sheet open={scannerOpen} onOpenChange={setScannerOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <SheetHeader><SheetTitle>{t("wpdAddMeal")}</SheetTitle></SheetHeader>
          <div className="pt-4">
            <FoodScanner onLogged={() => { setScannerOpen(false); void load(); }} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={weighOpen} onOpenChange={setWeighOpen}>
        <SheetContent side="bottom">
          <SheetHeader><SheetTitle>{t("wpdUpdateWeight")}</SheetTitle></SheetHeader>
          <div className="flex items-center gap-2 pt-4">
            <Input
              type="number" inputMode="decimal" step="0.1" className="h-11"
              value={weighIn} onChange={(e) => onWeighInChange(e.target.value)}
              placeholder={t("wpWeighInPlaceholder")}
            />
            <Button
              className="h-11 shrink-0"
              disabled={saving || !weighIn}
              onClick={() => { onWeighInSave(); setWeighOpen(false); }}
            >
              {t("wpLogWeight")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
