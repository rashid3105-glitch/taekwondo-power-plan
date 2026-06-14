// MUST match the literal expected by the `delete-my-account` edge function
// (see supabase/functions/delete-my-account/index.ts).
// Keep this constant in sync — the backend rejects the request with
// { error: "missing_confirmation" } otherwise.
export const DELETE_ACCOUNT_API_CONFIRMATION = "DELETE MY ACCOUNT";
