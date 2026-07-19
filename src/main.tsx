import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initNative, isNative } from "./lib/nativeInit";
import {
  hydrateAuthFromPreferences,
  bindAuthPersistence,
} from "./lib/nativeAuthStorage";
import { hydrateLangFromPreferences } from "./lib/nativeLangStorage";

// PWA service worker: ONLY register on the published *web* site.
// Skip in editor preview iframe AND in any Capacitor native runtime
// (native apps load from inside the bundle, no SW needed and it can
// interfere with the auth + offline flows we already have).
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if (isPreviewHost || isInIframe || isNative()) {
  // Aggressively unregister any stale service worker in preview/iframe/native contexts
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if ("serviceWorker" in navigator) {
  // Production / custom domain — register the generated SW
  window.addEventListener("load", () => {
    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    }).catch(() => {
      /* PWA module unavailable — ignore */
    });
  });
}

// Native bootstrap (StatusBar, SplashScreen, Android back button). No-op on web.
initNative();

// Native auth persistence: hydrate token from Capacitor Preferences BEFORE
// React mounts, then keep Preferences in sync on every auth change. No-op on web.
//
// Hardened: on native iOS a missing/unsynced Capacitor plugin can leave the
// bridge promise hanging forever (instead of rejecting), which would keep
// React from ever mounting → blank screen. We race every hydration promise
// against a short timeout, and swallow rejections, so render ALWAYS runs.
const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race<T | null>([
    p.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

(async () => {
  try {
    await Promise.all([
      withTimeout(hydrateAuthFromPreferences(), 4000),
      withTimeout(hydrateLangFromPreferences(), 4000),
    ]);
  } catch {
    /* never block mount */
  }
  createRoot(document.getElementById("root")!).render(<App />);
  // Bind listener after mount; supabase client is imported lazily inside.
  bindAuthPersistence();
})();

