import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { MousePointerClick } from "lucide-react";

const LABELS: Record<string, TranslationKey> = {
  home_hero_demo: "ctaHomeHeroDemo",
  home_hero_analysis: "ctaHomeHeroAnalysis",
  home_price_cta: "ctaHomePrice",
  home_bottom_cta: "ctaHomeBottom",
  home_bottom_analysis: "ctaHomeBottomAnalysis",
  pricing_analysis: "ctaPricingAnalysis",
  analysis_result_contact: "ctaAnalysisContact",
  contact_submitted: "ctaContactSubmitted",
};

type Row = { cta: string; mobile: number; desktop: number };

export function CtaClicksCard() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data, error } = await (supabase as any)
        .from("cta_clicks")
        .select("cta, device")
        .gte("created_at", since)
        .limit(10000);
      if (error) { setRows([]); return; }
      const map = new Map<string, Row>();
      for (const r of (data || []) as { cta: string; device: string | null }[]) {
        const row = map.get(r.cta) || { cta: r.cta, mobile: 0, desktop: 0 };
        if (r.device === "mobile") row.mobile++; else row.desktop++;
        map.set(r.cta, row);
      }
      setRows([...map.values()].sort((a, b) => b.mobile + b.desktop - (a.mobile + a.desktop)));
    })();
  }, []);

  return (
    <section className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-start gap-2">
        <MousePointerClick className="h-4 w-4 text-primary mt-0.5" aria-hidden />
        <div>
          <h2 className="text-sm font-bold text-card-foreground">{t("ctaStatsTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("ctaStatsDesc")}</p>
        </div>
      </div>
      {rows === null ? null : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("ctaStatsEmpty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground text-start">
                <th className="py-1.5 text-start font-semibold" />
                <th className="py-1.5 text-end font-semibold">{t("ctaStatsMobile")}</th>
                <th className="py-1.5 text-end font-semibold">{t("ctaStatsDesktop")}</th>
                <th className="py-1.5 text-end font-semibold">{t("ctaStatsClicks")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.cta} className="border-t border-border">
                  <td className="py-1.5 text-card-foreground">{LABELS[r.cta] ? t(LABELS[r.cta]) : r.cta}</td>
                  <td className="py-1.5 text-end tabular-nums">{r.mobile}</td>
                  <td className="py-1.5 text-end tabular-nums">{r.desktop}</td>
                  <td className="py-1.5 text-end tabular-nums font-bold text-card-foreground">{r.mobile + r.desktop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
