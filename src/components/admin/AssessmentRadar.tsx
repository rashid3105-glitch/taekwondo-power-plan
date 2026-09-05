import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { DIMENSIONS } from "@/data/clubAssessment";

export default function AssessmentRadar({ scores, max = 12 }: { scores: number[] | null; max?: number }) {
  const data = DIMENSIONS.map((d, i) => ({
    dim: d.name,
    score: Array.isArray(scores) ? (scores[i] ?? 0) : 0,
  }));

  return (
    <div className="mx-auto h-72 w-full max-w-[480px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="dim"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis domain={[0, max]} tickCount={4} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Radar dataKey="score" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
