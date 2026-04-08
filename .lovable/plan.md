

## Plan: Fix pricing page flow after login

### Problem
1. When clicking "Kom i gang" on a pricing tier, unauthenticated users are sent to `/auth` but never redirected back to the pricing page after login — they end up on the dashboard instead.
2. There is no clear navigation link to the pricing page from the dashboard/navigation after login.

### Changes

**1. Redirect back to pricing after login (`src/pages/Pricing.tsx`)**
- Change `navigate("/auth")` to `navigate("/auth?redirect=/pricing")` so the auth page knows to send users back to pricing after login.

**2. Handle redirect param in Auth page (`src/pages/Auth.tsx`)**
- Read `redirect` query param from the URL.
- After successful login, navigate to the `redirect` URL instead of the default `/dashboard`.

**3. Add pricing link to dashboard navigation (`src/pages/Dashboard.tsx`)**
- Ensure the "View Pricing" button is visible in the dashboard header/nav area so logged-in users can easily find it.

### Technical details
- 2-3 files modified: `Pricing.tsx` (1-line change), `Auth.tsx` (add redirect logic), optionally `Dashboard.tsx` (ensure pricing link visibility)
- No database changes needed

