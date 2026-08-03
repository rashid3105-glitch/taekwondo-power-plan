import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { forecastSeries, movingAverage, toDate, type WeightGoal, type WeightPoint } from "@/lib/weightPlanner";

interface Props {
  logs: WeightPoint[];
  goal: WeightGoal | null;
}

const RANGES = [30, 90, 0] as const;

export function WeightTrendChart({ logs, goal }: Props) {
  const { t } = useLanguage();
  const [range, setRange] = useState<number>(90);

  const data = useMemo(() => {
    const ma = movingAverage(logs);
    const cutoff = range > 0 ? Date.now() - range * 86400000 : 0;
    const filtered = ma.filter((p) => toDate(p.log_date).getTime() >= cutoff);
    const base = filtered.map((p) => ({
      log_date: p.log_date,
      weight: Number(p.weight_kg),
      avg: p.avg,
      forecast: undefined as number | undefined,
    }));
    if (goal) {
      const fc = forecastSeries(goal, logs);
      fc.forEach((f) => {
        const existing = base.find((b) => b.log_date === f.log_date);
        if (existing) existing.forecast = f.forecast;
        else base.push({ log_date: f.log_date, weight: undefined as unknown as number, avg: undefined as unknown as number, forecast: f.forecast });
      });
    }
    return base.sort((a, b) => a.log_date.localeCompare(b.log_date));
  }, [logs, goal, range]);

  const rangeLabel = (r: number) => (r === 30 ? t("wpRange30") : r === 90 ? t("wpRange90") : t("wpRangeAll"));

  if (!logs.length) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">{t("wpNoData")}</Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        {RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? "default" : "outline"}
            className="h-7 px-2.5 text-[11px]"
            onClick={() => setRange(r)}
          >
            {rangeLabel(r)}
          </Button>
        ))}
      </div>
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="log_date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              domain={["dataMin - 1", "dataMax + 1"]}
              width={38}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--foreground))",
              }}
              labelFormatter={(v) => new Date(String(v)).toLocaleDateString()}
            />
            {goal && (
              <ReferenceLine
                y={Number(goal.target_weight_kg)}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                label={{ value: t("wpGoal"), fontSize: 10, fill: "hsl(var(--primary))", position: "insideTopRight" }}
              />
            )}
            <Line type="monotone" dataKey="weight" name={t("wpCurrent")} stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={{ r: 2 }} connectNulls />
            <Line type="monotone" dataKey="avg" name={t("wpMovingAvg")} stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} connectNulls />
            <Line type="monotone" dataKey="forecast" name={t("wpForecast")} stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
