// Shared password complexity rules for any flow that creates or changes a password.
// Sign-in is intentionally NOT validated here so existing users with older,
// weaker passwords can still log in until they choose to update.

export type PasswordValidationResult = {
  ok: boolean;
  /** Translation key to surface to the user when ok is false. */
  messageKey: "passwordTooWeak" | "";
};

/**
 * A password is considered acceptable when it has at least 8 characters.
 * All character types are allowed — unicode letters (incl. æ/ø/å), digits,
 * symbols, emoji — to avoid surprising users who use Nordic letters.
 */
export function validatePassword(pw: string): PasswordValidationResult {
  if (typeof pw !== "string" || pw.length < 8) {
    return { ok: false, messageKey: "passwordTooWeak" };
  }
  return { ok: true, messageKey: "" };
}
