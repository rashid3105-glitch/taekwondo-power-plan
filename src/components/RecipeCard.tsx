import { useRef, useState } from "react";
import { type Recipe, RECIPE_CATEGORY_ICONS } from "@/data/recipes";
import { ChevronDown, ChevronUp, Clock, Flame, ImagePlus, Loader2, Trash2 } from "lucide-react";
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

const PHOTO_LABELS: Record<string, { add: string; replace: string; remove: string; uploading: string; hint: string }> = {
  en: { add: "Add photo", replace: "Replace photo", remove: "Remove photo", uploading: "Uploading…", hint: "Recommended: 1200×800 JPG, ≤300 KB (3:2 landscape)" },
  da: { add: "Tilføj foto", replace: "Skift foto", remove: "Fjern foto", uploading: "Uploader…", hint: "Anbefalet: 1200×800 JPG, ≤300 KB (3:2 liggende)" },
  no: { add: "Legg til foto", replace: "Bytt foto", remove: "Fjern foto", uploading: "Laster opp…", hint: "Anbefalt: 1200×800 JPG, ≤300 KB (3:2 liggende)" },
  sv: { add: "Lägg till foto", replace: "Byt foto", remove: "Ta bort foto", uploading: "Laddar upp…", hint: "Rekommenderat: 1200×800 JPG, ≤300 KB (3:2 liggande)" },
  de: { add: "Foto hinzufügen", replace: "Foto ersetzen", remove: "Foto entfernen", uploading: "Wird hochgeladen…", hint: "Empfohlen: 1200×800 JPG, ≤300 KB (3:2 Querformat)" },
  ar: { add: "أضف صورة", replace: "استبدال الصورة", remove: "إزالة الصورة", uploading: "جارٍ الرفع…", hint: "موصى به: 1200×800 JPG، ≤300 كيلوبايت (3:2 أفقي)" },
};

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  /** When provided, enables in-card photo editing (replace/remove). */
  onPhotoChange?: (file: File | null) => Promise<void>;
}

export function RecipeCard({ recipe, index, onPhotoChange }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useLanguage();
  const labels = PHOTO_LABELS[locale] ?? PHOTO_LABELS.en;
  const hasCustomPhoto = !!recipe.imageUrl;

  const triggerPick = () => fileRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file || !onPhotoChange) return;
    if (!file.type.startsWith("image/")) {
      alert(labels.hint);
      return;
    }
    // Soft size cap: 500 KB. Encourage compression.
    if (file.size > 500 * 1024) {
      alert(`${labels.hint}\n\n(${Math.round(file.size / 1024)} KB)`);
      return;
    }
    // Validate dimensions (landscape 3:2, tolerant)
    const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
      img.src = url;
    });
    if (dims) {
      const ratio = dims.w / dims.h;
      if (dims.w < 800 || ratio < 1.3 || ratio > 1.7) {
        alert(`${labels.hint}\n\n(${dims.w}×${dims.h})`);
        return;
      }
    }
    setBusy(true);
    try {
      await onPhotoChange(file);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!onPhotoChange) return;
    setBusy(true);
    try {
      await onPhotoChange(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className="text-base">{RECIPE_CATEGORY_ICONS[recipe.category]}</span>
        <span className="font-semibold text-sm text-card-foreground flex-1 text-left">{recipe.name}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Flame className="h-3 w-3" /> {recipe.calories} kcal
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 animate-slide-up">
          {/* Image with optional edit overlay */}
          <div className="relative">
            <img
              src={recipe.imageUrl || CATEGORY_IMAGES[recipe.category]}
              alt={recipe.name}
              loading="lazy"
              className="w-full h-40 sm:h-48 object-cover rounded-md border border-border"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = CATEGORY_IMAGES[recipe.category];
              }}
            />
            {onPhotoChange && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={triggerPick}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-background/90 backdrop-blur border border-border rounded-md px-2 py-1 hover:bg-background disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                    {busy ? labels.uploading : (hasCustomPhoto ? labels.replace : labels.add)}
                  </button>
                  {hasCustomPhoto && !busy && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-destructive/90 text-destructive-foreground rounded-md px-2 py-1 hover:bg-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      {labels.remove}
                    </button>
                  )}
                </div>
                <p className="absolute bottom-2 left-2 right-2 text-[10px] text-background/90 bg-foreground/40 backdrop-blur-sm rounded px-1.5 py-0.5 leading-tight pointer-events-none">
                  {labels.hint}
                </p>
              </>
            )}
          </div>

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
                <p className="text-sm font-bold text-card-foreground">{m.value}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{m.unit}</span></p>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("recipeIngredients")}</p>
            <ul className="grid grid-cols-2 gap-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-xs text-card-foreground/90 flex items-start gap-1.5">
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
                <li key={i} className="flex gap-2 text-xs text-card-foreground/90">
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
