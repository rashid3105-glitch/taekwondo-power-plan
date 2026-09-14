// Single source of truth for the subprocessor list shown in the privacy policy.
// Purpose/data, location and transfer basis are translation keys (see src/i18n/translations.ts).

export type Subprocessor = {
  /** Legal / commonly used supplier name — not translated. */
  name: string;
  /** Country of establishment — not translated. */
  country: string;
  /** Translation key: purpose and data categories. */
  purposeKey: string;
  /** Translation key: processing location. */
  locationKey: string;
  /** Translation key: transfer basis. */
  basisKey: string;
  /** Public privacy policy URL. */
  url: string;
};

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Lovable Labs Incorporated",
    country: "USA / Sweden",
    purposeKey: "privacySubLovable",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://lovable.dev/privacy",
  },
  {
    name: "Supabase, Inc. (Lovable Cloud)",
    country: "USA",
    purposeKey: "privacySubSupabase",
    locationKey: "privacySubLocEu",
    basisKey: "privacySubBasisEu",
    url: "https://supabase.com/privacy",
  },
  {
    name: "Google LLC (Gemini via Lovable AI Gateway)",
    country: "USA",
    purposeKey: "privacySubGemini",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://policies.google.com/privacy",
  },
  {
    name: "Stripe, Inc.",
    country: "USA / Ireland",
    purposeKey: "privacySubStripe",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://stripe.com/privacy",
  },
  {
    name: "Resend (Plus Five Five, Inc.)",
    country: "USA",
    purposeKey: "privacySubResend",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "Google LLC (Firebase Cloud Messaging)",
    country: "USA",
    purposeKey: "privacySubFcm",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://firebase.google.com/support/privacy",
  },
  {
    name: "Apple Inc. (App Store / TestFlight)",
    country: "USA / Ireland",
    purposeKey: "privacySubApple",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://www.apple.com/legal/privacy/",
  },
  {
    name: "Google Ireland Ltd. (Google Play)",
    country: "Ireland",
    purposeKey: "privacySubPlay",
    locationKey: "privacySubLocEuUs",
    basisKey: "privacySubBasisScc",
    url: "https://policies.google.com/privacy",
  },
  {
    name: "Apple Health / Health Connect",
    country: "USA / Ireland",
    purposeKey: "privacySubHealth",
    locationKey: "privacySubLocEu",
    basisKey: "privacySubBasisEu",
    url: "https://www.apple.com/legal/privacy/",
  },
];
