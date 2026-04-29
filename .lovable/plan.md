## Passkey Login (Face ID / Touch ID / Windows Hello)

Add WebAuthn passkeys so returning users sign in by tapping a button and confirming with their device biometric. The face/fingerprint never leaves the device — only a cryptographic signature does. Email + password stays as the fallback for new devices and recovery.

### How it will feel for the user

**On the Auth page (returning user, same device):**
- Big "Continue with Face ID" button at the top, above the email field.
- One tap → native Face ID prompt → straight into dashboard. No typing.
- Email + password form is collapsed below as "Use password instead".

**First-time enrollment (after a normal email/password login):**
- A one-time card on the dashboard: "Enable Face ID for faster login" → tap → Face ID prompt → done.
- Also accessible later from a new "Security" section in account settings.

**Edge cases:**
- New device or different browser → email + password as today, then offer to enroll.
- User loses device → password login still works; they can revoke old passkeys from Security settings.
- Up to 5 passkeys per account (one per device).

### What gets built

**1. Database — one new table**
- `user_passkeys`: stores the public key, credential ID, device label ("iPhone 15"), counter, last-used date. RLS so users only see/delete their own. No biometric data, only public keys.

**2. Edge functions — four small ones**
- `passkey-register-options` — issues a challenge for enrolling a new passkey.
- `passkey-register-verify` — verifies the enrollment response and stores the public key.
- `passkey-login-options` — issues a challenge for login (looked up by email).
- `passkey-login-verify` — verifies the signature and returns a Supabase session.

All four use the standard `@simplewebauthn/server` library (Deno-compatible).

**3. Frontend pieces**
- New `src/lib/passkeys.ts` helper wrapping `@simplewebauthn/browser` (handles browser + iOS Capacitor WebView).
- New "Continue with Face ID" button on `src/pages/Auth.tsx`, shown only when the browser supports WebAuthn.
- New `EnablePasskeyCard` shown once on the dashboard after first login (dismissible, remembered in profile).
- New "Security" section in account settings listing enrolled devices with a "Remove" button per passkey.
- Translations added for DA / EN / SV / DE / AR.

**4. iOS Capacitor support**
- Add `@capacitor/browser` is not needed — modern iOS WebView supports WebAuthn natively from iOS 16+.
- Configure the app's Associated Domains to bind passkeys to `sportstalent.dk`. This requires hosting an `apple-app-site-association` file at `https://sportstalent.dk/.well-known/apple-app-site-association` and adding the entitlement to the iOS project (one-time setup, you do this in Xcode after `npx cap sync`).

### Technical details

**Library**: `@simplewebauthn/server` (edge functions) + `@simplewebauthn/browser` (frontend). Industry standard, used by GitHub, Shopify, etc.

**Session bridging**: After `passkey-login-verify` succeeds, the edge function uses the Supabase service role key to generate a magic-link-style session token (`generateLink` with type `magiclink`) and returns it to the client, which calls `supabase.auth.verifyOtp` to establish the session. This is the standard Supabase pattern for custom auth flows.

**Security**:
- Challenges are single-use, 5-minute TTL, stored in a small `webauthn_challenges` table and deleted after verification.
- Origin and RP ID strictly checked against `sportstalent.dk` and the Capacitor app ID.
- Counter check prevents cloned-credential replay attacks.
- Rate limit on `passkey-login-options` (5/min per email) to prevent enumeration.

**iOS associated domains**: requires editing the iOS project once after `npx cap sync` to add the `webcredentials:sportstalent.dk` entitlement. I'll provide exact Xcode steps in the implementation message.

### Out of scope (call out explicitly)

- No actual face-recognition / camera capture — this is OS-level biometric only.
- No removal of email + password — it stays as fallback and admin recovery path.
- No passkey support on the published `taekwondo-power-plan.lovable.app` preview domain (passkeys are domain-bound to `sportstalent.dk` and the iOS app bundle).

### Rollout

1. Ship the database, edge functions, and Security settings UI first (no user-visible login change).
2. Test enrollment + login on iPhone (Capacitor build) and desktop Safari/Chrome.
3. Enable the "Continue with Face ID" button on the Auth page once verified end-to-end.
