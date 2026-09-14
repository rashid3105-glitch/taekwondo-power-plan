// Enforcement layer for youth (under 18) nutrition guidance.
// The system prompt asks the model not to produce numbers; this module is what
// actually enforces it. Pure and side-effect free so it can be unit tested.

const EASTERN_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/** Convert Eastern Arabic / Persian digits to ASCII so the patterns below apply. */
export function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (d) => EASTERN_DIGITS[d] ?? d);
}

// A number possibly written with ".", "," or a space (incl. NBSP/narrow NBSP)
// as thousands/decimal separator: 2400, 2.400, 2,400, 2 400, 0,5
const NUM = String.raw`\d+(?:[.,\u00A0\u202F\u2009 ]\d+)*`;

const CALORIE_WORDS = "kcal|cal|calorie|calories|kalorie|kalorier|kalorien|calorias|calorías|caloría|caloria|kj|سعرة|سعرات|حرارية";
const MACRO_WORDS = "protein|proteiner|eiwei|carb|carbs|carbohydrate|carbohidrato|kulhydrat|karbohydrat|kolhydrat|kohlenhydrat|fedt|fett|fat|fats|grasa|grasas|بروتين|دهون|كربوهيدرات";
const WEIGHT_UNITS = "kg|kilo|kilogram|kilogrammes|lbs|pounds|pund";

const FORBIDDEN: RegExp[] = [
  // number followed by an energy unit/word — "2400 kcal", "2.400 calorías"
  new RegExp(`${NUM}\\s*(?:${CALORIE_WORDS})(?![\\p{L}\\p{N}])`, "iu"),
  // energy word followed by a number — "kcal: 2400"
  new RegExp(`(?:${CALORIE_WORDS})\\s*[:=]?\\s*${NUM}`, "iu"),
  // number + gram unit near a macro word, and the reverse
  new RegExp(`${NUM}\\s*(?:g|gr|gram|grams|gramm)\\b[^.,;]{0,24}(?:${MACRO_WORDS})`, "iu"),
  new RegExp(`(?:${MACRO_WORDS})[^.,;]{0,24}${NUM}\\s*(?:g\\b|gr\\b|gram|grams|gramm|%)`, "iu"),
  // any percentage
  new RegExp(`${NUM}\\s*%`, "u"),
  // any body-weight figure — target weight or rate of change
  new RegExp(`${NUM}\\s*(?:${WEIGHT_UNITS})(?![\\p{L}\\p{N}])`, "iu"),
];

/**
 * True when the text contains a calorie, macro or body-weight figure that must
 * never be shown to a minor. Qualitative numbers (meal counts, hours, clock
 * times) are deliberately allowed.
 */
export function containsNumericNutritionTargets(text: string): boolean {
  const normalized = normalizeDigits(text);
  return FORBIDDEN.some((re) => re.test(normalized));
}
