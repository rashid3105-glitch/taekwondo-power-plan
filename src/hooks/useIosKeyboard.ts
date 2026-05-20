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
    (async () => {
      try {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
        if (cancelled) return;
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
        await Keyboard.setScroll({ isDisabled: true });
      } catch {
        /* plugin not available — ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
