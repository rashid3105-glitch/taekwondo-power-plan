import { supabase } from "@/integrations/supabase/client";

/**
 * Cookieless CTA click counter. Stores only which button, which page,
 * language and device class — no user id, IP or cookies. Fire-and-forget:
 * tracking must never block or break navigation.
 */
export function trackCta(cta: string) {
  try {
    const locale = (document.documentElement.lang || "").slice(0, 2);
    const device = window.innerWidth < 720 ? "mobile" : "desktop";
    void (supabase as any)
      .from("cta_clicks")
      .insert({
        cta,
        page: window.location.pathname.slice(0, 120) || "/",
        locale: ["en", "da", "sv", "de", "ar", "no", "es"].includes(locale) ? locale : null,
        device,
      })
      .then(() => undefined, () => undefined);
  } catch {
    /* never throw from tracking */
  }
}
