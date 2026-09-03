import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2 } from "lucide-react";

type Funnel = {
  sent: number;
  opened: number;
  confirmed: number;
  notMine: number;
  birthDateKnown: number;
  athletes: number;
};

/**
 * Guardian-consent funnel + date-of-birth coverage.
 * Read-only instrumentation for platform admins (Release A5).
 */
export function ConsentFunnelCard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState<Funnel | null>(null);

  useEffect(() => {
    (async () => {
      const [eventsRes, profilesRes] = await Promise.all([
        supabase.from("consent_token_events").select("token_id, event"),
        supabase.from("profiles").select("user_id, role, active_role, birth_date"),
      ]);

      const events = (eventsRes.data || []) as { token_id: string; event: string }[];
      const uniq = (name: string) =>
        new Set(events.filter((e) => e.event === name).map((e) => e.token_id)).size;

      const profiles = (profilesRes.data || []) as any[];
      const athletes = profiles.filter(
        (p) => (p.active_role || p.role) === "athlete",
      );

      setF({
        sent: uniq("sent"),
        opened: uniq("opened"),
        confirmed: uniq("confirmed"),
        notMine: uniq("not_my_child"),
        birthDateKnown: athletes.filter((p) => !!p.birth_date).length,
        athletes: athletes.length,
      });
      setLoading(false);
    })();
  }, []);

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

  return (
    <section className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {t("adminConsentFunnelTitle")}
      </h2>

      {loading || !f ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: t("adminConsentSent"), value: `${f.sent}` },
            { label: t("adminConsentOpened"), value: `${f.opened}`, hint: `${pct(f.opened, f.sent)}%` },
            { label: t("adminConsentConfirmed"), value: `${f.confirmed}`, hint: `${pct(f.confirmed, f.sent)}%` },
            { label: t("adminConsentNotMine"), value: `${f.notMine}` },
            {
              label: t("adminBirthDateCoverage"),
              value: `${pct(f.birthDateKnown, f.athletes)}%`,
              hint: `${f.birthDateKnown}/${f.athletes}`,
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-background p-3">
              <p className="text-2xl font-bold text-primary">{k.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{k.label}</p>
              {k.hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{k.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
