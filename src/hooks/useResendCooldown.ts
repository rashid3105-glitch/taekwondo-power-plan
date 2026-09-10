import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared cooldown for "resend confirmation email" buttons.
 * Supabase enforces ~60s per email; without a client-side cooldown users
 * hammer the button and hit 429 rate limits instead of getting a mail.
 */
export function useResendCooldown(seconds = 60) {
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    timer.current = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  /** Reads "after N seconds" from a Supabase rate-limit error, if present. */
  const startFromError = useCallback(
    (message?: string) => {
      const m = /after (\d+) second/i.exec(message ?? "");
      setRemaining(m ? Number(m[1]) : seconds);
    },
    [seconds],
  );

  return { remaining, sending, setSending, start, startFromError, disabled: remaining > 0 || sending };
}
