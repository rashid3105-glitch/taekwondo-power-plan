import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ClipboardList, Zap, Wind, Dumbbell, Timer, TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";
import { getLocalizedTestName } from "@/components/PhysicalTesting";

interface TestResult {
  id: string;
  test_name: string;
  category: string;
  value: number;
  unit: string;
  test_type: string;
  test_date: string;
}

const CATEGORY_ICONS: Record<string, typeof Timer> = {
  speed: Zap,
  endurance: Wind,
  strength: Dumbbell,
  agility: Timer,
};

const CATEGORY_COLORS: Record<string, string> = {
  speed: "hsl(190, 95%, 50%)",
  endurance: "hsl(35, 100%, 55%)",
  strength: "hsl(160, 80%, 45%)",
  agility: "hsl(280, 70%, 60%)",
};

const LINE_COLORS = [
  "hsl(190, 95%, 50%)",
  "hsl(35, 100%, 55%)",
  "hsl(160, 80%, 45%)",
  "hsl(280, 70%, 60%)",
  "hsl(0, 70%, 55%)",
  "hsl(45, 90%, 55%)",
];

type DateRange = "all" | "30d" | "90d" | "6m";

export function PhysicalTestProgress({ userId }: { userId?: string }) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const { t } = useLanguage();

  useEffect(() => {
    loadResults();
  }, [userId]);

  const loadResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const targetId = userId || user.id;

    const { data } = await supabase
      .from("physical_test_results" as any)
      .select("*")
      .eq("user_id", targetId)
      .order("test_date", { ascending: true });

    if (data) setResults(data as unknown as TestResult[]);
    setLoading(false);
  };

  const filteredResults = useMemo(() => {
    if (dateRange === "all") return results;
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === "30d") cutoff.setDate(now.getDate() - 30);
    else if (dateRange === "90d") cutoff.setDate(now.getDate() - 90);
    else if (dateRange === "6m") cutoff.setMonth(now.getMonth() - 6);
    return results.filter(r => new Date(r.test_date) >= cutoff);
  }, [results, dateRange]);

  const summaryByCategory = useMemo(() => {
    const categories = ["speed", "endurance", "strength", "agility"];
    return categories.map(cat => {
      const catResults = filteredResults.filter(r => r.category === cat);
      const testNames = [...new Set(catResults.map(r => r.test_name))];
      const tests = testNames.map(name => {
        const testResults = [...catResults.filter(r => r.test_name === name)].sort((a, b) =>
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
        );
        const latest = testResults[0];
        const previous = testResults[1];
        const allValues = testResults.map(r => r.value);
        const avg = allValues.length ? +(allValues.reduce((s, v) => s + v, 0) / allValues.length).toFixed(1) : 0;
        const best = allValues.length ? (["sec", "bpm"].includes(latest.unit) ? Math.min(...allValues) : Math.max(...allValues)) : 0;
        let trend: "up" | "down" | "same" | null = null;
        let changePercent: number | null = null;
        if (latest && previous) {
          const diff = latest.value - previous.value;
          const isLowerBetter = ["sec", "bpm"].includes(latest.unit);
          if (diff === 0) trend = "same";
          else if (isLowerBetter) trend = diff < 0 ? "up" : "down";
          else trend = diff > 0 ? "up" : "down";
          changePercent = previous.value !== 0 ? +((Math.abs(diff) / previous.value) * 100).toFixed(1) : null;
        }
        return { name, latest, previous, trend, changePercent, count: testResults.length, avg, best };
      });

      // Build chart data
      const dateMap = new Map<string, Record<string, number>>();
      for (const r of catResults) {
        if (!dateMap.has(r.test_date)) dateMap.set(r.test_date, {});
        dateMap.get(r.test_date)![r.test_name] = r.value;
      }
      const chartData = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => ({
          date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          ...values,
        }));

      // Calculate averages per test for reference lines
      const avgMap: Record<string, number> = {};
      for (const test of tests) {
        avgMap[test.name] = test.avg;
      }

      return { category: cat, tests, totalTests: catResults.length, testNames, chartData, avgMap };
    }).filter(c => c.totalTests > 0);
  }, [filteredResults]);

  if (loading || summaryByCategory.length === 0) return null;

  const dateRanges: { key: DateRange; label: string }[] = [
    { key: "all", label: t("ptRangeAll") || "All" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" },
    { key: "6m", label: "6m" },
  ];

  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {dateRanges.map(r => (
          <Button
            key={r.key}
            variant={dateRange === r.key ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setDateRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* Summary table */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-card-foreground">{t("ptProgressTitle")}</h3>
        </div>

        <div className="space-y-4">
          {summaryByCategory.map(({ category, tests }) => {
            const Icon = CATEGORY_ICONS[category] || ClipboardList;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" style={{ color: CATEGORY_COLORS[category] }} />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t(`ptCat_${category}`)}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{tests.reduce((s, t) => s + t.count, 0)} results</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 text-xs text-muted-foreground font-semibold">{t("ptTestName")}</th>
                        <th className="text-right py-1.5 text-xs text-muted-foreground font-semibold">{t("ptLatest")}</th>
                        <th className="text-right py-1.5 text-xs text-muted-foreground font-semibold">{t("ptPrevious")}</th>
                        <th className="text-right py-1.5 text-xs text-muted-foreground font-semibold hidden sm:table-cell">Avg</th>
                        <th className="text-right py-1.5 text-xs text-muted-foreground font-semibold hidden sm:table-cell">Best</th>
                        <th className="text-center py-1.5 text-xs text-muted-foreground font-semibold">{t("ptTrend")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map(test => (
                        <tr key={test.name} className="border-b border-border/50 last:border-0">
                          <td className="py-2 text-card-foreground font-medium">
                            {getLocalizedTestName(test.name, t)}
                            <span className="text-[10px] text-muted-foreground ml-1">({test.count}×)</span>
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-card-foreground">
                            {test.latest.value} {test.latest.unit}
                          </td>
                          <td className="py-2 text-right font-mono text-muted-foreground">
                            {test.previous ? `${test.previous.value} ${test.previous.unit}` : "—"}
                          </td>
                          <td className="py-2 text-right font-mono text-muted-foreground hidden sm:table-cell">
                            {test.avg} {test.latest.unit}
                          </td>
                          <td className="py-2 text-right font-mono text-card-foreground hidden sm:table-cell">
                            {test.best} {test.latest.unit}
                          </td>
                          <td className="py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {test.trend === "up" ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : test.trend === "down" ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : test.trend === "same" ? (
                                <Minus className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              {test.changePercent !== null && (
                                <span className={`text-[10px] font-bold ${test.trend === "up" ? "text-green-500" : test.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                                  {test.changePercent}%
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area charts per category */}
      {summaryByCategory.filter(c => c.chartData.length >= 2).map(({ category, testNames, chartData, avgMap }) => {
        const Icon = CATEGORY_ICONS[category] || ClipboardList;
        const catColor = CATEGORY_COLORS[category] || LINE_COLORS[0];
        const isSingleTest = testNames.length === 1;

        return (
          <div key={`chart-${category}`} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4" style={{ color: catColor }} />
              <h3 className="text-sm font-bold text-card-foreground">
                {t(`ptCat_${category}`)} — {t("ptTrend")}
              </h3>
            </div>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {isSingleTest ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`grad-${category}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={catColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={catColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 10%)",
                        border: `1px solid ${catColor}`,
                        borderRadius: 10,
                        fontSize: 12,
                        boxShadow: `0 4px 20px ${catColor}33`,
                      }}
                      labelStyle={{ color: "hsl(210, 20%, 95%)", fontWeight: 700 }}
                    />
                    <ReferenceLine
                      y={avgMap[testNames[0]]}
                      stroke={catColor}
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                      label={{ value: `Avg: ${avgMap[testNames[0]]}`, position: "right", fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey={testNames[0]}
                      stroke={catColor}
                      fill={`url(#grad-${category})`}
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: catColor, strokeWidth: 2, stroke: "hsl(220, 18%, 10%)" }}
                      activeDot={{ r: 7, fill: catColor, stroke: "hsl(220, 18%, 10%)", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 10%)",
                        border: `1px solid ${catColor}`,
                        borderRadius: 10,
                        fontSize: 12,
                        boxShadow: `0 4px 20px ${catColor}33`,
                      }}
                      labelStyle={{ color: "hsl(210, 20%, 95%)", fontWeight: 700 }}
                    />
                    {testNames.map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 5, fill: LINE_COLORS[i % LINE_COLORS.length], strokeWidth: 2, stroke: "hsl(220, 18%, 10%)" }}
                        activeDot={{ r: 7, fill: LINE_COLORS[i % LINE_COLORS.length], stroke: "hsl(220, 18%, 10%)", strokeWidth: 2 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {testNames.map((name, i) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: isSingleTest ? catColor : LINE_COLORS[i % LINE_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{getLocalizedTestName(name, t)}</span>
                  <span className="text-[10px] text-muted-foreground/60">(avg: {avgMap[name]})</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}