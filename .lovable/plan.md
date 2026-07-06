
# FCM push pipeline — live smoke-test plan

Goal: prove the full path works end-to-end before the Capacitor client is wired: **service-account JWT → OAuth token → FCM v1 send → device receives push → invalid token gets deactivated**.

## What you need to provide

One real FCM registration token from a test device. Easiest sources:

- **Firebase Console → Cloud Messaging → "Send test message"** flow shows a field to paste an FCM token; you can also grab a token from a small standalone test app.
- Or a browser using the Firebase JS SDK (`getToken()`).
- Or from any iOS/Android test build with `@capacitor-firebase/messaging` (even a scratch project).

Also tell me the `user_id` in your Sportstalent account you want to receive the test push (I can look it up if you give me your email).

## Steps

1. **Insert a test subscription row** for that user with `platform`, `fcm_token`, `is_active = true`. (Data insert — no schema change.)
2. **Call `send-push` as service role** with `{ user_ids: [<your_user_id>], title, body, url }`. I'll do this via a one-off service-role-authed request from the tool sandbox.
3. **Expected outcomes**
   - Response: `{ sent: 1, deactivated: 0 }`
   - Push arrives on the test device within a few seconds
   - `send-push` logs show FCM 200 responses, no auth errors
4. **Invalid-token cleanup test**: repeat step 2 after uninstalling the test app (or edit the token to garbage). Expected: `{ sent: 0, deactivated: 1 }` and the row's `is_active` flips to false.
5. **Preference gate test**: set `profiles.push_enabled = false` for the test user, resend. Expected: `{ sent: 0, reason: "opted_out" }`. Restore afterwards.
6. **Chat wrapper test (optional)**: send a chat message in the app to a user who has a token registered — verify `notify-chat-message` fires, recipient's locale is respected, sender does not get a self-push.
7. **Cleanup**: delete the test row, restore `push_enabled = true`.

## Reporting back

I'll report: HTTP status + body of each `send-push` call, relevant `send-push` log lines (FCM error codes if any), whether the device received the notification, and confirmation of the deactivation and opt-out branches.

## Fallback if you can't get a token right now

If sourcing a real token is inconvenient, we can partially validate by calling `send-push` with a syntactically valid but bogus FCM token — we'll see the OAuth exchange succeed and the FCM call return `UNREGISTERED`, which still exercises ~90 % of the code path (everything except actual delivery). Tell me if you'd prefer that route instead.
