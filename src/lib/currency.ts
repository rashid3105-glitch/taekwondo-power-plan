// Multi-currency display & checkout helper.
// Denmark -> DKK, Norway -> NOK, Sweden -> SEK, everywhere else -> EUR.

export type SupportedCurrency = "dkk" | "nok" | "sek" | "eur";

export interface PriceAmount {
  monthly: number;
  yearly: number;
}

// Per-tier amounts in major units (kr / €). Must match Stripe currency_options.
export const TIER_PRICES: Record<string, Record<SupportedCurrency, PriceAmount>> = {
  athlete: {
    dkk: { monthly: 59, yearly: 590 },
    nok: { monthly: 83, yearly: 830 },
    sek: { monthly: 95, yearly: 950 },
    eur: { monthly: 7.8, yearly: 78 },
  },
  coach_solo: {
    dkk: { monthly: 99, yearly: 950 },
    nok: { monthly: 139, yearly: 1330 },
    sek: { monthly: 159, yearly: 1530 },
    eur: { monthly: 13, yearly: 127 },
  },
  team_small: {
    dkk: { monthly: 399, yearly: 3830 },
    nok: { monthly: 559, yearly: 5360 },
    sek: { monthly: 639, yearly: 6160 },
    eur: { monthly: 53, yearly: 514 },
  },
  team_medium: {
    dkk: { monthly: 699, yearly: 6710 },
    nok: { monthly: 979, yearly: 9390 },
    sek: { monthly: 1119, yearly: 10780 },
    eur: { monthly: 94, yearly: 900 },
  },
  team_large: {
    dkk: { monthly: 1299, yearly: 12990 },
    nok: { monthly: 1819, yearly: 18190 },
    sek: { monthly: 2079, yearly: 20790 },
    eur: { monthly: 174, yearly: 1740 },
  },
};

const CURRENCY_LABEL: Record<SupportedCurrency, string> = {
  dkk: "DKK",
  nok: "NOK",
  sek: "SEK",
  eur: "EUR",
};

const CURRENCY_SYMBOL: Record<SupportedCurrency, string> = {
  dkk: "kr",
  nok: "kr",
  sek: "kr",
  eur: "€",
};

/**
 * Detect currency from browser locale.
 * Danish locale -> DKK, Norwegian -> NOK, Swedish -> SEK, anything else -> EUR.
 */
export function detectCurrency(): SupportedCurrency {
  if (typeof navigator === "undefined") return "eur";
  const langs = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .map((l) => l.toLowerCase());

  for (const l of langs) {
    if (l === "da" || l.startsWith("da-") || l.endsWith("-dk")) return "dkk";
    if (l === "nb" || l === "nn" || l === "no" || l.startsWith("nb-") || l.startsWith("nn-") || l.startsWith("no-") || l.endsWith("-no")) return "nok";
    if (l === "sv" || l.startsWith("sv-") || l.endsWith("-se")) return "sek";
  }
  return "eur";
}

export function formatPrice(
  amount: number,
  currency: SupportedCurrency,
  cycle: "monthly" | "yearly",
  locale: string,
): string {
  const perLabel = cycle === "monthly" ? perMonth(locale) : perYear(locale);
  // EUR uses decimals, the kr currencies are integer.
  if (currency === "eur") {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${formatted}${perLabel}`;
  }
  const label = CURRENCY_LABEL[currency];
  // Display Scandinavian currencies as e.g. "499 DKK"
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${label}${perLabel}`;
}

function perMonth(locale: string): string {
  if (locale.startsWith("da")) return "/md";
  if (locale.startsWith("sv")) return "/mån";
  if (locale.startsWith("no") || locale.startsWith("nb")) return "/md";
  if (locale.startsWith("de")) return "/Mon.";
  if (locale.startsWith("ar")) return "/شهر";
  if (locale.startsWith("es")) return "/mes";
  return "/mo";
}

function perYear(locale: string): string {
  if (locale.startsWith("da")) return "/år";
  if (locale.startsWith("sv")) return "/år";
  if (locale.startsWith("no") || locale.startsWith("nb")) return "/år";
  if (locale.startsWith("de")) return "/Jahr";
  if (locale.startsWith("ar")) return "/سنة";
  if (locale.startsWith("es")) return "/año";
  return "/yr";
}

export function getTierPrice(
  tier: string,
  currency: SupportedCurrency,
  cycle: "monthly" | "yearly",
): number | null {
  const t = TIER_PRICES[tier];
  if (!t) return null;
  return t[currency][cycle];
}
