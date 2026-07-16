// Native runtime bootstrap. Safe no-op on web.
// Called once from main.tsx.
import { Capacitor } from "@capacitor/core";

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Dark cockpit theme on authenticated screens — match with dark icons on light bg
    // would invert; keep light icons on our dark UI.
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  } catch {
    /* plugin missing — ignore */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Auto-hide is enabled by default in config; hide explicitly once React mounts.
    await SplashScreen.hide().catch(() => {});
  } catch {
    /* ignore */
  }

  // Android hardware back button → browser-like history pop, exit at root.
  try {
    const { App } = await import("@capacitor/app");
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    /* ignore */
  }

  // Kick off a throttled HealthKit sync in the background (iOS only). Safe
  // no-op if the plugin is missing, if the user hasn't authorized, or if we
  // synced within the last hour. Runs on app open + resume.
  try {
    const { syncHealthKit, isHealthKitAvailable } = await import("@/lib/healthkit");
    if (isHealthKitAvailable()) {
      const runSync = () => {
        syncHealthKit().catch((e) => console.warn("healthkit sync failed", e));
      };
      runSync();
      const { App } = await import("@capacitor/app");
      App.addListener("resume", runSync);
    }
  } catch {
    /* ignore */
  }
}

export const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};
