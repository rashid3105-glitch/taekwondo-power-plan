## Fix plan for the stuck coach dashboard

I found the main loop causing this:

- The **Home button on `/coach` does fire**, but it sends the user to `/`.
- `/` immediately redirects signed-in users to `/dashboard`.
- `Dashboard.tsx` then **forces coaches straight back to `/coach`**, even after coach mode was turned off.

So the problem is not the button icon itself — it is the **redirect chain overriding the user’s choice**.

### What I will change

1. **Stop the forced redirect from `/dashboard` unless coach mode is actually on**
   - Update `src/pages/Dashboard.tsx`
   - The current effect redirects based only on coach role / active club role.
   - I will make it respect the stored/current **coach mode state**, so a coach can return to the normal dashboard/front flow.

2. **Make all coach-exit actions use one consistent escape path**
   - Update `src/pages/CoachDashboard.tsx`
   - The Home/exit controls should:
     - turn coach mode off
     - navigate to the intended non-coach destination
     - not be immediately overridden by dashboard logic
   - I will also check the left-arrow button, since it currently goes to `/` without clearing coach mode.

3. **Harden role handling for club switching**
   - Update `src/contexts/RoleContext.tsx` if needed
   - Right now single-club users can still fall back to `profiles.role`, which can keep someone behaving like a coach even when the active membership logic should decide otherwise.
   - I will make the active club membership the source of truth where appropriate, so switching club or leaving coach mode does not bounce back incorrectly.

4. **Validate the full stuck flow in preview before stopping**
   - I will verify these exact cases:
     - click Home from `/coach` and confirm the URL stays off `/coach`
     - switch club after leaving coach mode and confirm it still stays out of coach dashboard
     - enter coach dashboard again intentionally and confirm that still works

## Files likely involved

- `src/pages/Dashboard.tsx`
- `src/pages/CoachDashboard.tsx`
- `src/contexts/RoleContext.tsx`

## Technical details

Current problematic chain:

```text
/coach
  -> Home click
  -> setCoachMode(false) + navigate('/')
  -> / redirects signed-in user to /dashboard
  -> Dashboard effect sees coach role in active club
  -> forced navigate('/coach')
```

The fix is to make the redirect logic depend on both:

- **user can act as coach**
- **user has actually chosen coach mode**

not just coach role alone.

Once you approve, I’ll implement this surgically and verify it in the preview.