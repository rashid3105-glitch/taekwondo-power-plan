import { describe, it, expect } from "vitest";
import { containsNumericNutritionTargets } from "./minorNutritionGuard";

const MUST_REJECT = [
  "Dit daglige mål er 2.400 kcal.",
  "Dagligt indtag: 2400 kalorier",
  "Målvægt: 62 kg",
  "Tab 0,5 kg om ugen frem mod stævnet.",
  "Protein: 150 g, kulhydrat: 300 g, fedt: 70 g",
  "Your daily target is 2,400 calories.",
  "Zielgewicht 62 kg",
  "Måltinntak: 2400 kcal",
  "Objetivo: 2.400 calorías al día",
  "الهدف اليومي ٢٤٠٠ سعرة حرارية",
  "Energibehov ca. 2 400 kcal",
];

const MUST_PASS = [
  "Spis tre måltider og to mellemmåltider om dagen.",
  "Drik vand jævnt over dagen, særligt de 2 timer før træning.",
  "Spis et måltid 3 timer før konkurrence.",
  "Vælg fuldkorn frem for hvidt brød.",
  "Sov 8 timer i døgnet.",
];

describe("containsNumericNutritionTargets", () => {
  it.each(MUST_REJECT)("rejects %s", (text) => {
    expect(containsNumericNutritionTargets(text)).toBe(true);
  });

  it.each(MUST_PASS)("allows %s", (text) => {
    expect(containsNumericNutritionTargets(text)).toBe(false);
  });
});
