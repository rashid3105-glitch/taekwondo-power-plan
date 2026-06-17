// Single-athlete progression: for each test the athlete has logged, show the
// 3 most recent results and a direction-aware improvement indicator.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  findTestByDbName,
  type TestDefinition,
  localizedTestName,
  isImprovement,
} from "@/lib/testCatalog";

interface Result {
  value: number;
  unit: string;
  test_date: string;
  test_name: string;
}

interface Props {
  athleteId: string;
}

export function AthleteProgressionView({ athleteId }: Props) {
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("physical_test_results")
        .select("test_name, value, unit, test_date")
        .eq("user_id", athleteId)
        .order("test_date", { ascending: false })
        .limit(500);
      if (cancelled) return;
      setResults(((data || []) as any[]).map((r) => ({
        test_name: r.test_name, value: Number(r.value), unit: r.unit, test_date: r.test_date,
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [athleteId]);

  // Group by test_name, keep the 3 most recent per group.
  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of results) {
      const arr = map.get(r.test_name) || [];
      arr.push(r);
      map.set(r.test_name, arr);
    }
    return Array.from(map.entries())
      .map(([name, arr]) => ({
        name,
        def: findTestByDbName(name) as TestDefinition | undefined,
        items: arr.slice(0, 3),
      }))
      .sort((a, b) =>
        (b.items[0]?.test_date || "").localeCompare(a.items[0]?.test_date || ""),
      );
  }, [results]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("ptNoTestsYet")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(({ name, def, items }) => {
        const label = def ? localizedTestName(def, locale) : name;
        const latest = items[0];
        const prev = items[1];
        let indicator: { label: string; tone: "good" | "bad" | "neutral"; Icon: typeof TrendingUp; delta: string } | null = null;
        if (latest && prev && def) {
          const improved = isImprovement(def, latest.value, prev.value);
          const diff = latest.value - prev.value;
          const deltaStr = `${diff > 0 ? "+" : ""}${(Math.round(diff * 100) / 100)} ${def.unit}`;
          if (improved === null) {
            indicator = { label: t("ptUnchanged"), tone: "neutral", Icon: Minus, delta: deltaStr };
          } else if (improved) {
            indicator = { label: t("ptImproved"), tone: "good", Icon: def.direction === "lower_is_better" ? TrendingDown : TrendingUp, delta: deltaStr };
          } else {
            indicator = { label: t("ptDeclined"), tone: "bad", Icon: def.direction === "lower_is_better" ? TrendingUp : TrendingDown, delta: deltaStr };
          }
        }

        return (
          <div key={name} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-card-foreground truncate">{label}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {def
                    ? def.direction === "lower_is_better" ? t("ptDirection_lower") : t("ptDirection_higher")
                    : ""}
                </p>
              </div>
              {indicator && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${
                    indicator.tone === "good" ? "text-emerald-500"
                    : indicator.tone === "bad" ? "text-destructive"
                    : "text-muted-foreground"
                  }`}
                >
                  <indicator.Icon className="h-3.5 w-3.5" />
                  <span>{indicator.label}</span>
                  <span className="text-[10px] font-normal opacity-80">({indicator.delta})</span>
                </div>
              )}
            </div>
            <ul className="text-sm divide-y divide-border/50">
              {items.map((r, i) => (
                <li key={`${r.test_date}-${i}`} className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">
                    {new Date(r.test_date).toLocaleDateString(locale)}
                  </span>
                  <span className="font-mono font-bold tabular-nums text-card-foreground">
                    {r.value} <span className="text-xs text-muted-foreground font-normal">{r.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
