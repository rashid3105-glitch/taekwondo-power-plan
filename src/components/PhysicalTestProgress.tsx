import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ClipboardList, Zap, Wind, Dumbbell, Timer, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

const LINE_COLORS = [
  "hsl(190, 95%, 50%)",
  "hsl(35, 100%, 55%)",
  "hsl(160, 80%, 45%)",
  "hsl(280, 70%, 60%)",
  "hsl(0, 70%, 55%)",
  "hsl(45, 90%, 55%)",
];

export function PhysicalTestProgress({ userId }: { userId?: string }) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
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

  const summaryByCategory = useMemo(() => {
    const categories = ["speed", "endurance", "strength", "agility"];
    return categories.map(cat => {
      const catResults = results.filter(r => r.category === cat);
      const testNames = [...new Set(catResults.map(r => r.test_name))];
      const tests = testNames.map(name => {
        const testResults = [...catResults.filter(r => r.test_name === name)].sort((a, b) =>
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
        );
        const latest = testResults[0];
        const previous = testResults[1];
        let trend: "up" | "down" | "same" | null = null;
        if (latest && previous) {
          const diff = latest.value - previous.value;
          const isLowerBetter = ["sec", "bpm"].includes(latest.unit);
          if (diff === 0) trend = "same";
          else if (isLowerBetter) trend = diff < 0 ? "up" : "down";
          else trend = diff > 0 ? "up" : "down";
        }
        return { name, latest, previous, trend, count: testResults.length };
      });

      // Build chart data: merge all tests by date
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

      return { category: cat, tests, totalTests: catResults.length, testNames, chartData };
    }).filter(c => c.totalTests > 0);
  }, [results]);

  if (loading || summaryByCategory.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("ptProgressTitle" as any)}</h3>
        </div>

        <div className="space-y-4">
          {summaryByCategory.map(({ category, tests }) => {
            const Icon = CATEGORY_ICONS[category] || ClipboardList;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t(`ptCat_${category}` as any)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 text-xs text-muted-foreground font-semibold">{t("ptTestName" as any)}</th>
                        <th className="text-right py-1.5 text-xs text-muted-foreground font-semibold">{t("ptLatest" as any)}</th>
                        <th className="text-right py-1.5 text-xs text-muted-foreground font-semibold">{t("ptPrevious" as any)}</th>
                        <th className="text-center py-1.5 text-xs text-muted-foreground font-semibold">{t("ptTrend" as any)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.map(test => (
                        <tr key={test.name} className="border-b border-border/50 last:border-0">
                          <td className="py-2 text-foreground font-medium">{test.name}</td>
                          <td className="py-2 text-right font-mono font-bold text-foreground">
                            {test.latest.value} {test.latest.unit}
                          </td>
                          <td className="py-2 text-right font-mono text-muted-foreground">
                            {test.previous ? `${test.previous.value} ${test.previous.unit}` : "—"}
                          </td>
                          <td className="py-2 text-center">
                            {test.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                            ) : test.trend === "down" ? (
                              <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />
                            ) : test.trend === "same" ? (
                              <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
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

      {/* Line charts per category */}
      {summaryByCategory.filter(c => c.chartData.length >= 2).map(({ category, testNames, chartData }) => {
        const Icon = CATEGORY_ICONS[category] || ClipboardList;
        return (
          <div key={`chart-${category}`} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                {t(`ptCat_${category}` as any)} — {t("ptTrend" as any)}
              </h3>
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 18%, 10%)",
                      border: "1px solid hsl(220, 15%, 18%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(210, 20%, 95%)" }}
                  />
                  {testNames.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {testNames.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {testNames.map((name, i) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
