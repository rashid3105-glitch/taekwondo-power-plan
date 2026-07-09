import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Defensive fix for a well-known Radix Dialog/Sheet bug on iOS WKWebView
 * (Capacitor): after a dialog closes — or when a component that owns an
 * open dialog is unmounted mid-close — Radix leaves
 *   <body style="pointer-events: none">
 * behind. On the web this is rarely visible, but in a native WebView it
 * makes the entire app unclickable until the process is killed.
 *
 * This guard:
 *  1) Observes body style mutations and clears `pointer-events: none`
 *     whenever no Radix dialog is currently open.
 *  2) Clears it on every route change as an extra safety net.
 */
export function BodyPointerEventsGuard() {
  const location = useLocation();

  useEffect(() => {
    const clearIfSafe = () => {
      const anyOpen = document.querySelector(
        '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]',
      );
      if (!anyOpen && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    };

    // Clear immediately (route just changed).
    clearIfSafe();

    const obs = new MutationObserver(() => clearIfSafe());
    obs.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    // Also poll briefly after route change — Radix cleanup can fire a tick later.
    const t1 = window.setTimeout(clearIfSafe, 150);
    const t2 = window.setTimeout(clearIfSafe, 600);

    return () => {
      obs.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.pathname]);

  return null;
}

export default BodyPointerEventsGuard;
