// Helper that wraps requestPermissions() and tries to detect when the
// HealthKit/Health Connect permission sheet never actually appeared.
//
// On iOS, if the user-gesture chain is broken (or the HealthKit entitlement
// is missing from the build), the call can resolve almost instantly with no
// real grant payload. We use a 300ms timing heuristic + payload inspection
// to flag this case so the wizard can suggest a reinstall.

import { requestPermissions, getLastPermissionGrant } from "./index";

export type PromptOutcome =
  | { kind: "granted"; raw: unknown }
  | { kind: "denied"; raw: unknown }
  | { kind: "never_shown"; reason: string }
  | { kind: "error"; message: string };

export async function requestWithDetection(): Promise<PromptOutcome> {
  const startedAt = performance.now();
  try {
    await requestPermissions();
  } catch (e: any) {
    return { kind: "error", message: e?.message || "Permission request failed" };
  }
  const elapsed = performance.now() - startedAt;
  const grant = getLastPermissionGrant();

  if (grant?.error) {
    return { kind: "error", message: grant.error };
  }

  const raw = grant?.raw ?? null;

  // Heuristic: if the call resolved very quickly AND the plugin returned
  // nothing meaningful, the iOS sheet almost certainly never appeared.
  const looksEmpty =
    raw == null ||
    (typeof raw === "object" && Object.keys(raw as object).length === 0);

  if (elapsed < 300 && looksEmpty) {
    return {
      kind: "never_shown",
      reason: "Permission sheet did not appear (resolved in " + Math.round(elapsed) + "ms with no payload).",
    };
  }

  // Inspect raw payload for any granted=true / authorized signal.
  if (raw && typeof raw === "object") {
    const flat = JSON.stringify(raw).toLowerCase();
    const hasGrant =
      flat.includes("granted") ||
      flat.includes("authorized") ||
      flat.includes("\"true\"") ||
      flat.includes(":true");
    if (!hasGrant && flat.length < 4) {
      return { kind: "denied", raw };
    }
  }

  return { kind: "granted", raw };
}
