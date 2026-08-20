# Admin club creation — findings and proposed follow-up

## What I checked

I inspected the live database rather than guessing:

- **Table permissions on `clubs`**: the `authenticated` role has full read/insert/update/delete access. No missing grant.
- **Access rules (RLS)**: there is an insert rule "Admins can insert clubs" that allows the insert when the signed-in user has the platform admin role. There is also an update rule and a read rule. All three target signed-in users.
- **Admin role data**: exactly one user holds the platform admin role (Farooq Rashid). The admin check function reads only the roles table — it does not require "superadmin mode" to be switched on.
- **Table shape**: every column the create form does not fill has a default (`max_athletes` 5, `share_coach_notes` false, `license_active` false, `sport` taekwondo, `created_at`). Nothing required is missing from the insert.
- **Triggers**: none on `clubs`.
- **Database error log**: no permission-denied, rule-violation or duplicate errors related to `clubs` in the retained log window.

## Conclusion

The reported cause — "blocked by database rules" — is **not confirmed**. Permissions and access rules for creating a club are correctly in place for a platform admin, and there is no error evidence in the logs. The finding looks stale or mis-attributed.

Two plausible real causes for a red error toast on that page, both unrelated to permissions:

1. **Duplicate name or slug.** `clubs.name` and `clubs.slug` are both unique. Creating a club whose name already exists (or whose name normalises to an existing slug) fails with a raw database message shown verbatim in the toast — which reads like a technical/permission failure to the user.
2. **The person testing is not a platform admin.** Being a club coach or having admin-like UI access is not the same as holding the platform admin role; only the role in the roles table satisfies the insert rule. In that case the page would normally redirect away, but a stale session could produce the failure instead.

## Proposed follow-up (only if you want it fixed)

No database change is needed. The work would be frontend-only, in `src/pages/AdminClubs.tsx`:

- Detect the duplicate-key error on create and show a clear message ("A club with that name already exists") instead of the raw database text.
- Do the same for the save action on existing clubs.
- Add translations for the new message in all 7 languages.

Optionally, ask the person who hit the error which club name they used and whether they are the platform admin account — that would pin the cause down definitively before changing anything.

## Technical notes

- Insert rule: `WITH CHECK (is_admin(auth.uid()))`, role `authenticated`.
- `is_admin` is a security-definer function reading `public.user_roles` for `role = 'admin'`.
- Unique indexes: `clubs_name_key`, `clubs_slug_key`.
- Slug is derived client-side by lowercasing the name and replacing non-alphanumerics with hyphens, so two differently-typed names can collide on slug.
