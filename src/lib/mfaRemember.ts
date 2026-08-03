const KEY_PREFIX = "mfa_trusted_device_";
const DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function key(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function rememberDevice(userId: string) {
  try {
    localStorage.setItem(key(userId), String(Date.now() + DURATION_MS));
  } catch { /* ignore */ }
}

export function isDeviceRemembered(userId: string): boolean {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return false;
    const expires = Number(raw);
    if (!Number.isFinite(expires) || Date.now() > expires) {
      localStorage.removeItem(key(userId));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function forgetDevice(userId: string) {
  try {
    localStorage.removeItem(key(userId));
  } catch { /* ignore */ }
}
