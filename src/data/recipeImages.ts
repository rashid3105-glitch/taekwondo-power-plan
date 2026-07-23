import type { RecipeCategory } from "./recipes";
import r3 from "@/assets/recipes/aftensmad-01-laks-soed-kartoffel.jpg.asset.json";
import r7 from "@/assets/recipes/aftensmad-02-kalkun-koedbolle-pasta.jpg.asset.json";
import r10 from "@/assets/recipes/aftensmad-03-oksekoeds-wok.jpg.asset.json";
import r19 from "@/assets/recipes/aftensmad-04-linse-groentsagscurry.jpg.asset.json";
import r29 from "@/assets/recipes/aftensmad-05-grillet-laks-ristede-groentsager.jpg.asset.json";
import r30 from "@/assets/recipes/aftensmad-06-chicken-tikka-basmati.jpg.asset.json";
import r31 from "@/assets/recipes/aftensmad-07-rejepasta-primavera.jpg.asset.json";
import r32 from "@/assets/recipes/aftensmad-08-oksekoeds-bolognese.jpg.asset.json";
import r5 from "@/assets/recipes/foer-01-foer-traening-toast.jpg.asset.json";
import r14 from "@/assets/recipes/foer-02-energi-smoothie.jpg.asset.json";
import r36 from "@/assets/recipes/foer-03-riskager-mandelsmoer-banan.jpg.asset.json";
import r37 from "@/assets/recipes/foer-04-banan-daddel-smoothie.jpg.asset.json";
import r38 from "@/assets/recipes/foer-05-havre-honning-energibarer.jpg.asset.json";
import r2 from "@/assets/recipes/frokost-01-kylling-ris-meal-prep.jpg.asset.json";
import r9 from "@/assets/recipes/frokost-02-tun-avocado-ris-skaal.jpg.asset.json";
import r12 from "@/assets/recipes/frokost-03-kylling-caesar-wrap.jpg.asset.json";
import r17 from "@/assets/recipes/frokost-04-teriyaki-kylling-ris-skaal.jpg.asset.json";
import r25 from "@/assets/recipes/frokost-05-kalkun-quinoa-power-skaal.jpg.asset.json";
import r26 from "@/assets/recipes/frokost-06-tun-nicoise-salat.jpg.asset.json";
import r27 from "@/assets/recipes/frokost-07-sorte-boenner-soed-kartoffel.jpg.asset.json";

// Per-recipe custom photos, keyed by recipe id in src/data/recipes.ts.
export const RECIPE_IMAGES: Record<string, string> = {
  r2: r2.url,
  r3: r3.url,
  r5: r5.url,
  r7: r7.url,
  r9: r9.url,
  r10: r10.url,
  r12: r12.url,
  r14: r14.url,
  r17: r17.url,
  r19: r19.url,
  r25: r25.url,
  r26: r26.url,
  r27: r27.url,
  r29: r29.url,
  r30: r30.url,
  r31: r31.url,
  r32: r32.url,
  r36: r36.url,
  r37: r37.url,
  r38: r38.url,
};

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
