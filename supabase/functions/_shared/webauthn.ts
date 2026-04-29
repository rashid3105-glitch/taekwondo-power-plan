// Shared WebAuthn config used by all passkey edge functions.
// Relying Party (RP) ID must match the domain users authenticate from.
// For Capacitor iOS the RP ID stays the same as the website domain
// (configured via Associated Domains in the iOS project).

export const RP_NAME = "Sportstalent";
export const RP_ID = "sportstalent.dk";

// Allowed origins that can send WebAuthn requests.
// Includes the production domain, www subdomain, and the Capacitor iOS scheme.
export const EXPECTED_ORIGINS = [
  "https://sportstalent.dk",
  "https://www.sportstalent.dk",
  "capacitor://localhost",
  "http://localhost",
];

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
