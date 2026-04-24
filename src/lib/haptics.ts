/**
 * Lightweight haptics layer.
 *
 * Wraps `navigator.vibrate` with iOS-safe no-op fallback (iOS Safari ignores
 * `vibrate` entirely). All helpers are synchronous, fire-and-forget, and
 * never throw — so they're safe to sprinkle into UI handlers without try/catch.
 */

const supportsVibrate = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.vibrate === "function";
};

const safeVibrate = (pattern: number | number[]): void => {
  if (!supportsVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
};

/** Light single tap — nav switches, button presses, toggles. */
export const tap = (): void => safeVibrate(8);

/** Confirmation buzz — successful save, plan generated, set logged. */
export const success = (): void => safeVibrate([12, 30, 12]);

/** Sharper double for warnings / non-blocking errors. */
export const warn = (): void => safeVibrate([20, 40, 20]);

/** Stronger triple for hard errors / destructive blocks. */
export const error = (): void => safeVibrate([30, 50, 30, 50, 30]);

export const haptics = { tap, success, warn, error };
