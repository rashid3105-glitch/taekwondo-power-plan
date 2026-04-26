// Trend chart of post-competition reflection ratings across competitions.
// Visualizes how an athlete's self-rated dimensions (overall performance, mental
// readiness, focus, emotional control, tactical execution, physical condition,
// recovery, post-comp mood) evolve event-by-event. Inspired by FormCurveChart.

import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type RatingKey =
  | "overallPerformance" | "mentalReadiness" | "focusDuringMatches"
  | "emotionalControl" | "tacticalExecution" | "physicalCondition"
  | "recoveryBetweenMatches" | "postCompMood";

interface Reflection {
  id: string;
  competition_name: string | null;
  competition_date: string | null;
  created_at: string;
  ratings: Record<string, number>;
}

interface Props {
  reflections: Reflection[];
  /** Limit which dimensions render. Defaults to a focused set of 4. */
  keys?: RatingKey[];
  className?: string;
}

const COLORS: Record<RatingKey, string> = {
  overallPerformance: "hsl(280, 70%, 60%)",
  mentalReadiness:    "hsl(190, 95%, 50%)",
  focusDuringMatches: "hsl(210, 80%, 55%)",
  emotionalControl:   "hsl(160, 80%, 45%)",
  tacticalExecution:  "hsl(40, 95%, 55%)",
  physicalCondition:  "hsl(0, 80%, 55%)",
  recoveryBetweenMatches: "hsl(330, 70%, 60%)",
  postCompMood:       "hsl(130, 60%, 50%)",
};

const DEFAULT_KEYS: RatingKey[] = [
  "overallPerformance",
  "mentalReadiness",
  "focusDuringMatches",
  "tacticalExecution",
];

export function ReflectionTrendChart({ reflections, keys = DEFAULT_KEYS, className }: Props) {
  const { t } = useLanguage();

  const data = useMemo(() => {
    // Oldest -> newest left-to-right.
    return [...reflections]
      .filter((r) => r.ratings && Object.keys(r.ratings).length > 0)
      .sort((a, b) => {
        const da = a.competition_date || a.created_at;
        const db = b.competition_date || b.created_at;
        return da < db ? -1 : 1;
      })
      .map((r) => {
        const dateStr = r.competition_date || r.created_at.slice(0, 10);
        const label = (r.competition_name || "—").slice(0, 18);
        const point: any = {
          label,
          dateLabel: new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        };
        for (const k of keys) {
          if (typeof r.ratings[k] === "number") point[k] = r.ratings[k];
        }
        return point;
      });
  }, [reflections, keys]);

  if (data.length < 2) {
    return (
      <div className={`rounded-xl border border-border bg-card p-4 shadow-card ${className ?? ""}`}>
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" /> {t("reflectionTrendTitle")}
        </h4>
        <p className="text-xs text-muted-foreground">{t("reflectionTrendNeedMore")}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 shadow-card space-y-3 ${className ?? ""}`}>
      <div>
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> {t("reflectionTrendTitle")}
        </h4>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t("reflectionTrendDesc")}</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[1, 10]} ticks={[1, 2, 4, 6, 8, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
            formatter={(value: any, name: string) => [`${value}/10`, t(`reflectionRating_${name}` as any)]}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            formatter={(v: string) => t(`reflectionRating_${v}` as any) as string}
          />
          {keys.map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[k]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
