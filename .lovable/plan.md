I found the failing call: `add-athlete-by-code` returns HTTP 409 for `TKD-173424` because the athlete is already linked to you in another club, so the backend asks for cross-club confirmation. The UI currently treats that non-2xx function response as a generic “Edge Function returned a non-2xx status code”, so the confirm dialog never appears.

Plan:
1. Update the add-by-code frontend flow so it can read the Edge Function response body even when the status is 409.
2. Show the existing cross-club confirmation dialog for `CROSS_CLUB_CONFIRM` instead of the red generic error toast.
3. Keep the second confirmed request unchanged, so the athlete is then added to the active club and the dashboard refreshes.
4. Improve error handling so future backend errors show the specific Danish message instead of “Edge Function returned a non-2xx status code”.
5. Validate with the actual `TKD-173424` flow against the deployed function after the code change.