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

type ClubRow = {
  clubId: string | null;
  name: string;
  sent: number;
  opened: number;
  confirmed: number;
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
  const [clubRows, setClubRows] = useState<ClubRow[]>([]);

  useEffect(() => {
    (async () => {
      const [eventsRes, profilesRes, clubsRes] = await Promise.all([
        supabase.from("consent_token_events").select("token_id, event, club_id"),
        supabase.from("profiles").select("user_id, role, active_role, birth_date, club_id"),
        supabase.from("clubs").select("id, name"),
      ]);

      const events = (eventsRes.data || []) as {
        token_id: string;
        event: string;
        club_id: string | null;
      }[];
      const clubNames = new Map<string, string>(
        ((clubsRes.data || []) as any[]).map((c) => [c.id as string, c.name as string]),
      );

      // Tokens that produced any event at all — the honest denominator when a
      // token predates instrumentation and never logged a "sent".
      const tokensWithAnyEvent = new Set(events.map((e) => e.token_id));
      const tokensFor = (name: string) =>
        new Set(events.filter((e) => e.event === name).map((e) => e.token_id));

      const sentTokens = tokensFor("sent");
      const denominator = Math.max(sentTokens.size, tokensWithAnyEvent.size);

      const profiles = (profilesRes.data || []) as any[];
      const athletes = profiles.filter((p) => (p.active_role || p.role) === "athlete");

      setF({
        sent: denominator,
        opened: tokensFor("opened").size,
        confirmed: tokensFor("confirmed").size,
        notMine: tokensFor("not_my_child").size,
        birthDateKnown: athletes.filter((p) => !!p.birth_date).length,
        athletes: athletes.length,
      });

      // Per-club breakdown. A token's club comes from its events; athletes come
      // from their profile club.
      const byClub = new Map<string, ClubRow>();
      const row = (clubId: string | null): ClubRow => {
        const key = clubId ?? "__none__";
        let r = byClub.get(key);
        if (!r) {
          r = {
            clubId,
            name: (clubId && clubNames.get(clubId)) || t("adminConsentNoClub"),
            sent: 0,
            opened: 0,
            confirmed: 0,
            birthDateKnown: 0,
            athletes: 0,
          };
          byClub.set(key, r);
        }
        return r;
      };

      const seen = new Map<string, Set<string>>(); // event -> token ids counted
      for (const e of events) {
        const set = seen.get(e.event) ?? new Set<string>();
        if (set.has(e.token_id)) continue;
        set.add(e.token_id);
        seen.set(e.event, set);
        const r = row(e.club_id ?? null);
        if (e.event === "sent") r.sent++;
        else if (e.event === "opened") r.opened++;
        else if (e.event === "confirmed") r.confirmed++;
      }
      for (const a of athletes) {
        const r = row(a.club_id ?? null);
        r.athletes++;
        if (a.birth_date) r.birthDateKnown++;
      }

      setClubRows(
        Array.from(byClub.values())
          .filter((r) => r.sent + r.opened + r.confirmed + r.athletes > 0)
          .sort(
            (a, b) =>
              b.athletes - b.birthDateKnown - (a.athletes - a.birthDateKnown) ||
              b.sent - a.sent,
          ),
      );

      setLoading(false);
    })();
  }, []);

  const pct = (n: number, d: number) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0);

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
        <>
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

          {clubRows.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("adminConsentByClub")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground/70">
                      <th className="text-left font-medium py-1 pr-2"> </th>
                      <th className="text-right font-medium py-1 px-2">{t("adminConsentSent")}</th>
                      <th className="text-right font-medium py-1 px-2">{t("adminConsentOpened")}</th>
                      <th className="text-right font-medium py-1 px-2">{t("adminConsentConfirmed")}</th>
                      <th className="text-right font-medium py-1 pl-2">{t("adminBirthDateCoverage")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubRows.map((r) => (
                      <tr key={r.clubId ?? "none"} className="border-t border-border/60">
                        <td className="py-1.5 pr-2 truncate max-w-[10rem]">{r.name}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{r.sent}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{r.opened}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{r.confirmed}</td>
                        <td className="py-1.5 pl-2 text-right tabular-nums">
                          {r.birthDateKnown}/{r.athletes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
