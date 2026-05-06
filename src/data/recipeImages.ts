import type { RecipeCategory } from "./recipes";

// Stable, free Unsplash photos per category (compressed via Unsplash CDN params).
export const CATEGORY_IMAGES: Record<RecipeCategory, string> = {
  breakfast:
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=75&auto=format&fit=crop",
  lunch:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=75&auto=format&fit=crop",
  dinner:
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=75&auto=format&fit=crop",
  snack:
    "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=75&auto=format&fit=crop",
  "pre-workout":
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=75&auto=format&fit=crop",
  "post-workout":
    "https://images.unsplash.com/photo-1622484211148-7a1c7a55d4d4?w=800&q=75&auto=format&fit=crop",
};

// Lightweight keyword → category guesser for AI-generated meals (no category field).
export function guessCategoryFromMealName(name: string | undefined | null): RecipeCategory {
  const n = (name ?? "").toLowerCase();
  if (/(breakfast|morgen|frokost\s*morgen|frühstück|فطور|morning)/.test(n)) return "breakfast";
  if (/(snack|mellemmåltid|mellanmål|imbiss|وجبة\s*خفيفة)/.test(n)) return "snack";
  if (/(pre[-\s]?workout|før\s*træning|före\s*träning|pre[-\s]?entrenamiento|قبل\s*التمرين)/.test(n))
    return "pre-workout";
  if (/(post[-\s]?workout|efter\s*træning|efter\s*träning|recovery|بعد\s*التمرين)/.test(n))
    return "post-workout";
  if (/(dinner|aftensmad|middag|abendessen|عشاء)/.test(n)) return "dinner";
  if (/(lunch|frokost|lunsj|mittag|غداء)/.test(n)) return "lunch";
  return "lunch";
}

export function getMealImage(name: string | undefined | null, category?: RecipeCategory): string {
  return CATEGORY_IMAGES[category ?? guessCategoryFromMealName(name)];
}
