import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Loader2 } from "lucide-react";
import { type RecipeCategory } from "@/data/recipes";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const CATEGORIES: RecipeCategory[] = ["breakfast", "lunch", "dinner", "snack", "pre-workout", "post-workout"];

const CATEGORY_KEYS: Record<RecipeCategory, TranslationKey> = {
  breakfast: "catBreakfast",
  lunch: "catLunch",
  dinner: "catDinner",
  snack: "catSnack",
  "pre-workout": "catPreWorkout",
  "post-workout": "catPostWorkout",
};

interface AddRecipeFormProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddRecipeForm({ onClose, onAdded }: AddRecipeFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<RecipeCategory>("lunch");
  const [prepTime, setPrepTime] = useState("15 min");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [tip, setTip] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast({ title: t("recipeNameError"), variant: "destructive" });
      return;
    }

    const ingredientsList = ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
    const stepsList = steps.split("\n").map((s) => s.trim()).filter(Boolean);

    if (ingredientsList.length === 0) {
      toast({ title: t("recipeIngredientError"), variant: "destructive" });
      return;
    }
    if (stepsList.length === 0) {
      toast({ title: t("recipeStepError"), variant: "destructive" });
      return;
    }

    const cal = parseInt(calories) || 0;
    const prot = parseInt(protein) || 0;
    const carb = parseInt(carbs) || 0;
    const f = parseInt(fat) || 0;

    if (cal < 0 || cal > 5000 || prot < 0 || prot > 500 || carb < 0 || carb > 500 || f < 0 || f > 500) {
      toast({ title: t("recipeMacroError"), variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: t("recipeLoginRequired"), variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("user_recipes").insert({
      user_id: user.id,
      name: trimmedName,
      category,
      prep_time: prepTime.trim().slice(0, 30) || "15 min",
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: f,
      ingredients: ingredientsList.slice(0, 20).map((s) => s.slice(0, 200)),
      steps: stepsList.slice(0, 15).map((s) => s.slice(0, 300)),
      tip: tip.trim().slice(0, 300),
    });

    if (error) {
      toast({ title: t("recipeSaveFailed"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("recipeAdded") });
      onAdded();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{t("recipeFormTitle")}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">{t("recipeNameLabel")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken Power Bowl" maxLength={100} required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("recipeCategoryLabel")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as RecipeCategory)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{t(CATEGORY_KEYS[c])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">{t("recipePrepTimeLabel")}</Label>
            <Input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="15 min" maxLength={30} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("recipeCaloriesLabel")}</Label>
            <Input type="number" inputMode="numeric" min={0} max={5000} value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="400" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("recipeProteinLabel")}</Label>
            <Input type="number" inputMode="numeric" min={0} max={500} value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="30" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("recipeCarbsLabel")}</Label>
            <Input type="number" inputMode="numeric" min={0} max={500} value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="40" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">{t("recipeFatLabel")}</Label>
            <Input type="number" inputMode="numeric" min={0} max={500} value={fat} onChange={(e) => setFat(e.target.value)} placeholder="15" className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">{t("recipeIngredientsLabel")}</Label>
          <Textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder={"200g chicken breast\n150g brown rice\n100g broccoli"} rows={4} className="mt-1 text-xs" />
        </div>

        <div>
          <Label className="text-xs">{t("recipeStepsLabel")}</Label>
          <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"Season chicken with salt and pepper.\nGrill for 6-7 min per side.\nServe over rice with broccoli."} rows={4} className="mt-1 text-xs" />
        </div>

        <div>
          <Label className="text-xs">{t("recipeTipLabel")}</Label>
          <Input value={tip} onChange={(e) => setTip(e.target.value)} placeholder="Great for post-training recovery..." maxLength={300} className="mt-1" />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("recipeSaving")}</> : <><Plus className="h-4 w-4 mr-1" /> {t("recipeAddButton")}</>}
        </Button>
      </form>
    </div>
  );
}
