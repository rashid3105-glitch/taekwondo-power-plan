import { Capacitor } from "@capacitor/core";
import { NativeBiometric, BiometryType } from "@capgo/capacitor-native-biometric";

const SERVER = "dk.sportstalent.app";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const res = await NativeBiometric.isAvailable();
    return res.isAvailable;
  } catch {
    return false;
  }
}

export async function getBiometryLabel(): Promise<string> {
  if (!isNative()) return "Biometrics";
  try {
    const res = await NativeBiometric.isAvailable();
    switch (res.biometryType) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        return "Face ID";
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        return "Touch ID";
      default:
        return "Biometrics";
    }
  } catch {
    return "Biometrics";
  }
}

export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  if (!isNative()) return;
  await NativeBiometric.setCredentials({ username: email, password, server: SERVER });
}

export async function hasSavedBiometricCredentials(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const creds = await NativeBiometric.getCredentials({ server: SERVER });
    return !!creds?.username;
  } catch {
    return false;
  }
}

export async function getBiometricCredentialsWithPrompt(reason: string): Promise<{ email: string; password: string } | null> {
  if (!isNative()) return null;
  await NativeBiometric.verifyIdentity({
    reason,
    title: "Sportstalent",
    subtitle: reason,
  });
  const creds = await NativeBiometric.getCredentials({ server: SERVER });
  if (!creds?.username) return null;
  return { email: creds.username, password: creds.password };
}

export async function clearBiometricCredentials(): Promise<void> {
  if (!isNative()) return;
  try {
    await NativeBiometric.deleteCredentials({ server: SERVER });
  } catch {
    /* ignore */
  }
}
