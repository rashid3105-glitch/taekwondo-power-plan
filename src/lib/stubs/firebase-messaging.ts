// Stub for `firebase/messaging` used only by the web fallback of
// @capacitor-firebase/messaging. The app never runs FCM in the browser
// (native-only via Capacitor), so we alias the peer dep to this shim to
// keep it out of the web bundle. The exports must exist because the
// plugin's web.js imports them by name, but they are never invoked.
export const deleteToken = async () => false;
export const getMessaging = () => ({});
export const getToken = async () => "";
export const isSupported = async () => false;
export const onMessage = () => () => {};
