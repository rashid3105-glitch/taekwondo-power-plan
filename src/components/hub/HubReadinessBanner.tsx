import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sun, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ReadinessCard } from "@/components/ReadinessCard";

/**
 * Conditional dismissible morning readiness banner.
 * Only appears if the athlete has not completed today's readiness check
 * and hasn't dismissed it for today. Persists dismissal via localStorage
 * so it does not reappear until the next day.
 */
export function HubReadinessBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const dismissKey = `readiness_banner_dismissed:${todayStr}`;

  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem(dismissKey)) {
          setChecked(true);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setChecked(true); return; }
        const { data } = await supabase
          .from("readiness_checkins")
          .select("id")
          .eq("user_id", user.id)
          .eq("checkin_date", todayStr)
          .maybeSingle();
        if (!data) setShow(true);
      } finally {
        setChecked(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked || !show) return null;

  return <ReadinessCard />;
}
