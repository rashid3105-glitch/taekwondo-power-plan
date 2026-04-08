

## Plan: Add Stripe Checkout Flow

### What changes
Replace the manual PayPal payment flow with Stripe Checkout. When a user clicks "Get Started" on the pricing page, they'll be redirected to a Stripe-hosted checkout page. After payment, a webhook updates their `payment_status` in the database automatically.

### Steps

**1. Create Stripe products and prices**
Use the Stripe tools to create 4 price objects:
- Personal Monthly & Yearly
- Coach Monthly & Yearly
(Enterprise stays as "Contact Us")

**2. Create edge function: `create-checkout-session`**
- Accepts `priceId` and `billingCycle` from the frontend
- Creates or retrieves a Stripe customer linked to the authenticated user's email
- Creates a Stripe Checkout Session with `mode: 'subscription'`
- Returns the checkout URL
- Includes success/cancel URLs pointing back to the app

**3. Create edge function: `stripe-webhook`**
- Listens for `checkout.session.completed` and `customer.subscription.deleted` events
- On successful checkout: updates `profiles.payment_status` to `'paid'` and sets `payment_date`
- On subscription cancelled: sets `payment_status` back to `'unpaid'`
- Verifies webhook signature for security

**4. Update `src/pages/Pricing.tsx`**
- Replace the PayPal dialog with a direct "Subscribe" button
- On click: call `create-checkout-session` edge function, then redirect to Stripe's hosted checkout
- Keep the "Request Demo" option
- Add a loading state while creating the session

**5. Create success page `src/pages/PaymentSuccess.tsx`**
- Simple confirmation page shown after Stripe redirects back
- Links to dashboard

**6. Add route for success page in `App.tsx`**

### File changes
- `supabase/functions/create-checkout-session/index.ts` — new
- `supabase/functions/stripe-webhook/index.ts` — new
- `src/pages/Pricing.tsx` — replace PayPal dialog with Stripe checkout button
- `src/pages/PaymentSuccess.tsx` — new success page
- `src/App.tsx` — add `/payment-success` route
- `src/i18n/translations.ts` — add keys for payment success messages

### Technical details
- Stripe customer ID will be stored by matching on the user's email (no new DB column needed initially)
- The webhook edge function uses `verify_jwt = false` since Stripe calls it directly — security via webhook signature verification
- The checkout session includes `client_reference_id` set to the user's Supabase `user_id` so the webhook can update the correct profile
- CORS headers included in checkout session function for browser calls

