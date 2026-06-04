// Dashboard banner that nudges the athlete to complete a post-competition
// reflection within 14 days of an event. Hidden after submission, when no
// past comp exists, or when dismissed for the session.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface PendingComp {
  id: string;
  name: string;
  event_date: string;
  result: string | null;
  requested_by_coach: boolean;
}

const DISMISS_PREFIX = "reflectionPromptDismissed:";

export function ReflectionPromptCard() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [comp, setComp] = useState<PendingComp | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const today = new Date().toISOString().slice(0, 10);
      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

      const [{ data: past }, { data: refls }] = await Promise.all([
        supabase
          .from("competitions")
          .select("id, name, event_date, result")
          .eq("user_id", user.id)
          .gte("event_date", cutoff)
          .lt("event_date", today)
          .order("event_date", { ascending: false })
          .limit(5),
        supabase
          .from("competition_reflections")
          .select("competition_id")
          .eq("user_id", user.id)
          .not("competition_id", "is", null),
      ]);

      if (cancelled) return;
      const reflectedIds = new Set((refls || []).map((r: any) => r.competition_id));
      const pending = (past || []).find((c: any) => {
        if (reflectedIds.has(c.id)) return false;
        if (sessionStorage.getItem(`${DISMISS_PREFIX}${c.id}`) === "1") return false;
        return true;
      }) as PendingComp | undefined;
      setComp(pending ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!comp) return null;

  const formatted = (() => {
    try {
      return new Date(comp.event_date).toLocaleDateString(locale === "ar" ? "ar" : locale, {
        month: "short", day: "numeric", year: "numeric",
      });
    } catch { return comp.event_date; }
  })();

  return (
    <div
      className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-card p-4 sm:p-5 shadow-card"
      style={{ backgroundImage: "radial-gradient(ellipse at 90% 0%, hsl(var(--primary) / 0.18), transparent 65%)" }}
    >
      <button
        onClick={() => { sessionStorage.setItem(`${DISMISS_PREFIX}${comp.id}`, "1"); setComp(null); }}
        aria-label={t("dashboardReflectPromptLater")}
        className="absolute top-2 right-2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("dashboardReflectPromptTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("dashboardReflectPromptDesc")}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground bg-background/60 border border-border rounded-lg px-3 py-2">
            <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold truncate">{comp.name}</span>
            <span className="text-muted-foreground shrink-0">· {formatted}</span>
            {comp.result && <span className="text-muted-foreground truncate">· {comp.result}</span>}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => navigate(`/competitions/${comp.id}/reflect`)}
              className="gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("dashboardReflectPromptCTA")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { sessionStorage.setItem(`${DISMISS_PREFIX}${comp.id}`, "1"); setComp(null); }}
            >
              {t("dashboardReflectPromptLater")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
