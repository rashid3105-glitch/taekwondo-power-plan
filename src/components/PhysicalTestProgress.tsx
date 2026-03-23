import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { ClipboardList, Zap, Wind, Dumbbell, Timer, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      .order("test_date", { ascending: false });

    if (data) setResults(data as unknown as TestResult[]);
    setLoading(false);
  };

  const summaryByCategory = useMemo(() => {
    const categories = ["speed", "endurance", "strength", "agility"];
    return categories.map(cat => {
      const catResults = results.filter(r => r.category === cat);
      const testNames = [...new Set(catResults.map(r => r.test_name))];
      const tests = testNames.map(name => {
        const testResults = catResults.filter(r => r.test_name === name).sort((a, b) =>
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
      return { category: cat, tests, totalTests: catResults.length };
    }).filter(c => c.totalTests > 0);
  }, [results]);

  if (loading || summaryByCategory.length === 0) return null;

  return (
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
  );
}
