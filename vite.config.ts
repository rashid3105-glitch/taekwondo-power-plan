import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Never run service worker in dev / Lovable preview iframe
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        "favicon.png",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
      ],
      manifest: false, // we ship our own public/manifest.json
      workbox: {
        // Allow large JS bundles to be precached (main chunk grew past 5MB)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Don't intercept Lovable internal routes or API/auth calls
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        // Network-first for Supabase (auth + data must be fresh)
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith(".supabase.co") ||
              url.hostname.endsWith(".supabase.in"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "image" ||
              request.destination === "font" ||
              request.destination === "style" ||
              request.destination === "script",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "app-shell",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `firebase/messaging` is a peer dep of @capacitor-firebase/messaging's
      // web fallback only. We use FCM natively via Capacitor, never in the
      // browser, so alias it to a no-op stub to avoid pulling firebase into
      // the web bundle (and to fix the rollup "isSupported is not exported"
      // build error when the peer dep isn't installed).
      "firebase/messaging": path.resolve(__dirname, "./src/lib/stubs/firebase-messaging.ts"),
    },
  },
}));
