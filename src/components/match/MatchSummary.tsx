import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useLanguage } from "@/i18n/LanguageContext";
import { techniquesFor, type Discipline } from "@/lib/tkdTechniques";
import { Activity, Target, ArrowLeftRight } from "lucide-react";

interface MatchTag {
  id: string;
  technique: string;
  side: "left" | "right" | "n/a";
  outcome: "scored" | "conceded" | "penalty" | "none";
}

interface MatchSummaryProps {
  tags: MatchTag[];
  discipline: Discipline;
}

const COLOR_PRIMARY = "hsl(190, 95%, 50%)";
const COLOR_SCORED = "hsl(160, 80%, 45%)";
const COLOR_CONCEDED = "hsl(0, 80%, 55%)";
const COLOR_PENALTY = "hsl(35, 100%, 55%)";
const COLOR_LEFT = "hsl(190, 95%, 50%)";
const COLOR_RIGHT = "hsl(280, 70%, 60%)";

export function MatchSummary({ tags, discipline }: MatchSummaryProps) {
  const { t } = useLanguage();
  const techList = useMemo(() => techniquesFor(discipline), [discipline]);

  const techData = useMemo(() => {
    const map = new Map<string, number>();
    for (const tag of tags) map.set(tag.technique, (map.get(tag.technique) || 0) + 1);
    return Array.from(map.entries())
      .map(([key, count]) => {
        const def = techList.find((x) => x.key === key);
        return { name: def ? t(def.labelKey as any) : key, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [tags, techList, t]);

  const outcomeData = useMemo(() => {
    const counts = { scored: 0, conceded: 0, penalty: 0, none: 0 };
    for (const tag of tags) counts[tag.outcome]++;
    const total = counts.scored + counts.conceded + counts.penalty;
    return {
      scored: counts.scored,
      conceded: counts.conceded,
      penalty: counts.penalty,
      total,
      efficiency: total > 0 ? Math.round((counts.scored / total) * 100) : 0,
      pieData: [
        { name: t("matchOutcomeScored"), value: counts.scored, color: COLOR_SCORED },
        { name: t("matchOutcomeConceded"), value: counts.conceded, color: COLOR_CONCEDED },
        { name: t("matchOutcomePenalty"), value: counts.penalty, color: COLOR_PENALTY },
      ].filter((d) => d.value > 0),
    };
  }, [tags, t]);

  const sideData = useMemo(() => {
    const counts = { left: 0, right: 0 };
    for (const tag of tags) {
      if (tag.side === "left") counts.left++;
      else if (tag.side === "right") counts.right++;
    }
    const total = counts.left + counts.right;
    return {
      left: counts.left,
      right: counts.right,
      total,
      data: total > 0 ? [
        { name: t("matchSideLeft"), value: counts.left, pct: Math.round((counts.left / total) * 100), color: COLOR_LEFT },
        { name: t("matchSideRight"), value: counts.right, pct: Math.round((counts.right / total) * 100), color: COLOR_RIGHT },
      ] : [],
    };
  }, [tags, t]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {t("matchSummaryTechniques")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {techData.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">{t("matchNoTags")}</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, techData.length * 28)}>
              <BarChart data={techData} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--muted))" }}
                />
                <Bar dataKey="count" fill={COLOR_PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {t("matchSummaryEfficiency")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outcomeData.total === 0 ? (
            <div className="text-xs text-muted-foreground italic">{t("matchNoOutcomes")}</div>
          ) : (
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-foreground">{outcomeData.efficiency}%</div>
                <div className="text-xs text-muted-foreground">{t("matchScoringEfficiency")}</div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={outcomeData.pieData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={56}>
                    {outcomeData.pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            {t("matchSummarySide")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sideData.total === 0 ? (
            <div className="text-xs text-muted-foreground italic">{t("matchNoSideData")}</div>
          ) : (
            <div className="space-y-3 pt-2">
              {sideData.data.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground">{d.value} · {d.pct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-muted-foreground italic pt-1">
                {sideData.data.length === 2 && Math.abs(sideData.data[0].pct - sideData.data[1].pct) > 30
                  ? t("matchSideImbalance")
                  : t("matchSideBalanced")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
