## Plan

1. **Fix all chat Realtime channel names**
   - Keep the existing unique per-thread message channel in `useMessages`.
   - Update the thread-list subscription in `useThreads` so it also uses a unique channel topic per mount, not the static `threads-<userId>` topic.

2. **Make cleanup safe for native WebViews**
   - Add a cancellation guard around the async auth lookup in `useThreads` so a channel is not created after the component has already unmounted.
   - Remove the channel in cleanup if it was created.

3. **Align backend Realtime topic policy**
   - The previous per-thread topic changed from `thread-<uuid>` to `thread-<uuid>-<random>`, but the Realtime policy still parses only exact `thread-<uuid>` topics.
   - Add a migration that allows the new suffixed topics securely by extracting the UUID portion and still checking that the user is a member of that thread.
   - Also allow suffixed `threads-<userId>-<random>` topics for the personal thread-list feed.

4. **Verify**
   - Run a targeted TypeScript/build check if available.
   - Confirm the code no longer contains static reusable chat channel topics that can be re-bound after `subscribe()`.

## Technical details

The error happens when a channel object has already reached `joining`/`joined`, and code tries to call `.on("postgres_changes", ...)` on that same cached channel. This can happen in React remounts and is more visible in native Capacitor WebViews. The fix is to ensure every subscription instance gets a fresh topic, and that the backend Realtime authorization policy understands those fresh topics instead of rejecting them.