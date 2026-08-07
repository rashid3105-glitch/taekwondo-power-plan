/**
 * Club branding helpers: hex validation, hex -> HSL token conversion,
 * lightness clamping and contrast checks so a club colour can never make
 * the dark cockpit UI unreadable.
 */

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(v: string | null | undefined): v is string {
  return !!v && HEX_RE.test(v.trim());
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.trim().replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** CSS variable value format used by the design tokens: "H S% L%". */
export function hslTriplet(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

/** Relative luminance (WCAG). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Dark cockpit background used for the contrast check. */
export const COCKPIT_BG = "#0F1115";

/** Foreground colour that reads best on top of the given colour. */
export function readableForeground(hex: string): string {
  return luminance(hex) > 0.45 ? "222 35% 10%" : "0 0% 100%";
}

export interface ClubThemeTokens {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
}

/**
 * Derive readable surface + text tokens from a background colour, so panels,
 * borders and text stay visible on both light and dark club backgrounds.
 */
export function deriveSurfaces(backgroundHex: string): Partial<ClubThemeTokens> {
  const { h, s, l } = hexToHsl(backgroundHex);
  // Clamp so extreme values can't produce an unusable UI.
  const bgL = Math.min(97, Math.max(4, l));
  const sat = Math.min(40, s);
  const isDark = bgL < 50;
  const step = (d: number) => Math.min(99, Math.max(2, isDark ? bgL + d : bgL - d));

  return {
    background: hslTriplet(h, sat, bgL),
    foreground: isDark ? hslTriplet(h, Math.min(15, sat), 97) : hslTriplet(h, Math.min(20, sat), 10),
    card: hslTriplet(h, sat, step(4)),
    cardForeground: isDark ? hslTriplet(h, Math.min(15, sat), 96) : hslTriplet(h, Math.min(20, sat), 12),
    popover: hslTriplet(h, sat, step(6)),
    popoverForeground: isDark ? hslTriplet(h, Math.min(15, sat), 96) : hslTriplet(h, Math.min(20, sat), 12),
    muted: hslTriplet(h, sat, step(8)),
    mutedForeground: isDark ? hslTriplet(h, Math.min(15, sat), 68) : hslTriplet(h, Math.min(20, sat), 38),
    border: hslTriplet(h, sat, step(14)),
    input: hslTriplet(h, sat, step(14)),
  };
}

/**
 * Convert club hex colours into token values, clamping lightness to a range
 * that stays visible on both the light public pages and the dark cockpit.
 */
export function buildClubTheme(
  primaryHex?: string | null,
  accentHex?: string | null,
  backgroundHex?: string | null,
): Partial<ClubThemeTokens> {
  const out: Partial<ClubThemeTokens> = {};
  if (isValidHex(primaryHex)) {
    const { h, s, l } = hexToHsl(primaryHex);
    const cl = Math.min(72, Math.max(34, l));
    out.primary = hslTriplet(h, Math.min(100, Math.max(20, s)), cl);
    out.primaryForeground = readableForeground(primaryHex);
  }
  if (isValidHex(accentHex)) {
    const { h, s, l } = hexToHsl(accentHex);
    const cl = Math.min(78, Math.max(30, l));
    out.accent = hslTriplet(h, Math.min(100, Math.max(15, s)), cl);
    out.accentForeground = readableForeground(accentHex);
  }
  if (isValidHex(backgroundHex)) {
    Object.assign(out, deriveSurfaces(backgroundHex));
  }
  return out;
}

export const DEFAULT_PRIMARY = "#D4AF37";
export const DEFAULT_ACCENT = "#1A1A1A";
export const DEFAULT_BACKGROUND = COCKPIT_BG;

