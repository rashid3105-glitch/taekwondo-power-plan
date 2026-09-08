import { supabase } from "@/integrations/supabase/client";

/**
 * Shared admin helpers for account recovery actions.
 * Used by both AdminApproval and AdminLeads so the reset-link flow exists once.
 */
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/** Re-sends the sign-up confirmation email to a user who never confirmed. */
export async function resendConfirmationEmail(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth?tab=signin` },
  });
  if (error) throw error;
}

/** Best-effort server-side log of an admin recovery action. */
export async function logAdminUserAction(
  userId: string,
  kind: "resend_confirmation" | "send_reset",
  ok: boolean,
) {
  try {
    await supabase.functions.invoke("admin-leads", {
      body: { action: "log_action", user_id: userId, kind, ok },
    });
  } catch {
    /* logging must never break the UI */
  }
}
