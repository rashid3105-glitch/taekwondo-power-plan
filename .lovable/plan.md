# Update Social Share Image

Replace the current social share image (shown when the site is shared on social media, iMessage, WhatsApp, etc.) with the newly uploaded `logo-2.png`.

## Steps

1. Copy `user-uploads://logo-2.png` to `public/social-share.png` so it's served at `https://sportstalent.dk/social-share.png`.
2. Update `index.html`:
   - Set `og:image` to `https://sportstalent.dk/social-share.png`
   - Set `twitter:image` to `https://sportstalent.dk/social-share.png`
3. Note: The image is 1024×1024. This works for most platforms but is square — Twitter/Facebook prefer 1200×630. The logo will still display correctly, just centered. If you want a wide banner version later, we can generate one.

## Files Changed

- `public/social-share.png` (new)
- `index.html` (og:image + twitter:image meta tags)

## After Publishing

Social platforms cache share images aggressively. After publishing, you may need to use Facebook's Sharing Debugger or Twitter's Card Validator to force a refresh.
