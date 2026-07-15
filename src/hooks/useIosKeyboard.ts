import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Configures the iOS keyboard so it resizes the native WebView instead of
 * pushing the whole page up. Combined with `100dvh` layouts, this prevents
 * sticky headers from disappearing when an input is focused.
 *
 * No-op on web / Android.
 */
export function useIosKeyboard() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
    let cancelled = false;
    let keyboardMod: typeof import("@capacitor/keyboard") | null = null;
    (async () => {
      try {
        const mod = await import("@capacitor/keyboard");
        if (cancelled) return;
        keyboardMod = mod;
        await mod.Keyboard.setResizeMode({ mode: mod.KeyboardResize.Native });
        await mod.Keyboard.setScroll({ isDisabled: true });
      } catch {
        /* plugin not available — ignore */
      }
    })();
    return () => {
      cancelled = true;
      // Restore global WebView scroll — otherwise leaving this page leaves
      // the entire app un-scrollable on iOS (setScroll disables the WKWebView
      // scrollView.isScrollEnabled globally, not just for this page).
      if (keyboardMod) {
        keyboardMod.Keyboard.setScroll({ isDisabled: false }).catch(() => {});
      }
    };
  }, []);
}
