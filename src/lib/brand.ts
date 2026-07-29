/** Central brand tokens. Keep in sync with --gold* in src/index.css. */
export const GOLD = "#D4AF37";
export const GOLD_LIGHT = "#E8C86A";
export const GOLD_RGB = "212,175,55";
export const BRAND_BG = "#0B0C14";

/** rgba() helper for gold-derived shadows/borders. */
export const goldAlpha = (a: number) => `rgba(${GOLD_RGB},${a})`;
