import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNative, isNative } from "./lib/nativeInit";
import {
  hydrateAuthFromPreferences,
  bindAuthPersistence,
} from "./lib/nativeAuthStorage";

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
(async () => {
  await hydrateAuthFromPreferences();
  createRoot(document.getElementById("root")!).render(<App />);
  // Bind listener after mount; supabase client is imported lazily inside.
  bindAuthPersistence();
})();
