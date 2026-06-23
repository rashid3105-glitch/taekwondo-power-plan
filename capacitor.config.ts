import type { CapacitorConfig } from '@capacitor/cli';

// NOTE: The `server.url` block was used during early development to hot-reload
// the iOS/Android apps from the Lovable preview URL. That URL requires a
// Lovable login session, which a real device does not have, so it produces
// a "proxy error" overlay on iPhone. It also blocks HealthKit / Health
// Connect, which only bridge reliably when the web layer is loaded from
// inside the app bundle.
//
// For real-device testing of native features, leave `server` removed and run:
//   npm run build && npx cap sync ios   (or android)
//
// Only re-add `server.url` temporarily if you need hot-reload for non-native
// UI work and you don't care about HealthKit during that session.
const config: CapacitorConfig = {
  appId: 'dk.sportstalent.app',
  appName: 'Sportstalent',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
