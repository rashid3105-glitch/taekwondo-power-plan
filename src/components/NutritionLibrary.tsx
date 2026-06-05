import { useState, useEffect } from "react";
import { getRecipes, RECIPE_CATEGORY_ICONS, type RecipeCategory, type Recipe } from "@/data/recipes";
import { RecipeCard } from "./RecipeCard";
import { AddRecipeForm } from "./AddRecipeForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

interface UserRecipeRow {
  id: string;
  name: string;
  category: string;
  prep_time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
  tip: string;
  image_url?: string | null;
}

function toRecipe(row: UserRecipeRow): Recipe & { isCustom: true; dbId: string } {
  return {
    id: `custom-recipe-${row.id}`,
    dbId: row.id,
    isCustom: true,
    name: row.name,
    category: row.category as RecipeCategory,
    prepTime: row.prep_time,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    ingredients: row.ingredients,
    steps: row.steps,
    tip: row.tip,
    imageUrl: row.image_url || undefined,
  };
}

export function NutritionLibrary() {
  const [filter, setFilter] = useState<RecipeCategory | "all" | "custom">("all");
  const [showForm, setShowForm] = useState(false);
  const [userRecipes, setUserRecipes] = useState<(Recipe & { isCustom: true; dbId: string })[]>([]);
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const builtIn = getRecipes(locale);

  useEffect(() => {
    loadUserRecipes();
  }, []);

  const loadUserRecipes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoggedIn(false); setUserId(null); return; }
    setIsLoggedIn(true);
    setUserId(user.id);

    const [{ data }, { data: overrides }] = await Promise.all([
      supabase.from("user_recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("recipe_photo_overrides").select("recipe_id, image_url").eq("user_id", user.id),
    ]);

    if (data) {
      setUserRecipes((data as unknown as UserRecipeRow[]).map(toRecipe));
    }
    if (overrides) {
      const map: Record<string, string> = {};
      for (const o of overrides as { recipe_id: string; image_url: string }[]) {
        map[o.recipe_id] = o.image_url;
      }
      setPhotoOverrides(map);
    }
  };

  const deleteCustomRecipe = async (dbId: string) => {
    const { error } = await supabase.from("user_recipes").delete().eq("id", dbId);
    if (error) {
      toast({ title: t("recipeDeleteFailed"), variant: "destructive" });
    } else {
      toast({ title: t("recipeDeleted") });
      setUserRecipes((prev) => prev.filter((r) => r.dbId !== dbId));
    }
  };

  const uploadAndSwap = async (file: File | null, currentUrl: string | undefined) => {
    if (!userId) return null;
    // Best-effort remove old file in our bucket if it was ours
    if (currentUrl) {
      const marker = "/recipe-images/";
      const idx = currentUrl.indexOf(marker);
      if (idx !== -1) {
        const oldPath = currentUrl.slice(idx + marker.length);
        if (oldPath.startsWith(`${userId}/`)) {
          await supabase.storage.from("recipe-images").remove([oldPath]);
        }
      }
    }
    if (!file) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("recipe-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      toast({ title: t("recipeSaveFailed"), description: upErr.message, variant: "destructive" });
      throw upErr;
    }
    return supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
  };

  const allRecipes = [
    ...builtIn.map((r) => ({
      ...r,
      isCustom: false as const,
      imageUrl: photoOverrides[r.id] || r.imageUrl,
    })),
    ...userRecipes,
  ];

  const filtered = filter === "all"
    ? allRecipes
    : filter === "custom"
    ? userRecipes
    : allRecipes.filter((r) => r.category === filter);

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
          {t("allFilter")} ({allRecipes.length})
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
            {RECIPE_CATEGORY_ICONS[cat]} {t(CATEGORY_KEYS[cat])} ({allRecipes.filter((r) => r.category === cat).length})
          </button>
        ))}
        {userRecipes.length > 0 && (
          <button
            onClick={() => setFilter("custom")}
            data-active={filter === "custom"}
            className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors cursor-pointer
              data-[active=true]:bg-tab-nutrition data-[active=true]:text-foreground
              data-[active=false]:text-muted-foreground hover:text-foreground"
          >
            {t("recipeMyRecipes")} ({userRecipes.length})
          </button>
        )}
      </div>

      {isLoggedIn && !showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t("recipeAddCustom")}
        </Button>
      )}

      {showForm && (
        <AddRecipeForm onClose={() => setShowForm(false)} onAdded={loadUserRecipes} />
      )}

      <div className="space-y-2">
        {filtered.map((recipe, i) => {
          const isCustom = "isCustom" in recipe && recipe.isCustom;
          const handlePhotoChange = isCustom
            ? async (file: File | null) => {
                const dbId = (recipe as Recipe & { dbId: string }).dbId;
                if (!userId) return;
                let newUrl: string | null = null;
                try { newUrl = await uploadAndSwap(file, recipe.imageUrl); } catch { return; }
                const { error } = await supabase
                  .from("user_recipes")
                  .update({ image_url: newUrl })
                  .eq("id", dbId);
                if (error) {
                  toast({ title: t("recipeSaveFailed"), description: error.message, variant: "destructive" });
                  return;
                }
                setUserRecipes((prev) =>
                  prev.map((r) => (r.dbId === dbId ? { ...r, imageUrl: newUrl || undefined } : r)),
                );
              }
            : isLoggedIn
            ? async (file: File | null) => {
                if (!userId) return;
                const currentOverride = photoOverrides[recipe.id];
                let newUrl: string | null = null;
                try { newUrl = await uploadAndSwap(file, currentOverride); } catch { return; }
                if (newUrl) {
                  const { error } = await supabase
                    .from("recipe_photo_overrides")
                    .upsert({ user_id: userId, recipe_id: recipe.id, image_url: newUrl }, { onConflict: "user_id,recipe_id" });
                  if (error) {
                    toast({ title: t("recipeSaveFailed"), description: error.message, variant: "destructive" });
                    return;
                  }
                  setPhotoOverrides((prev) => ({ ...prev, [recipe.id]: newUrl! }));
                } else {
                  await supabase
                    .from("recipe_photo_overrides")
                    .delete()
                    .eq("user_id", userId)
                    .eq("recipe_id", recipe.id);
                  setPhotoOverrides((prev) => {
                    const next = { ...prev };
                    delete next[recipe.id];
                    return next;
                  });
                }
              }
            : undefined;

          return (
            <div key={recipe.id} className="relative">
              <RecipeCard recipe={recipe} index={i + 1} onPhotoChange={handlePhotoChange} />
              {isCustom && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                  <span className="text-[9px] bg-tab-nutrition/15 text-tab-nutrition px-1.5 py-0.5 rounded-full font-bold uppercase">{t("customLabel")}</span>
                  <button
                    onClick={() => deleteCustomRecipe((recipe as Recipe & { dbId: string }).dbId)}
                    className="h-6 w-6 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors"
                    title={t("delete")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
