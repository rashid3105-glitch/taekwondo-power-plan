import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface Row {
  test_name: string;
  category: string;
  unit: string;
  athlete_value: number;
  club_median: number;
  sample_size: number;
}

interface Props {
  athleteId: string;
}

export function PhysicalTestComparison({ athleteId }: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_club_test_medians" as any, { _athlete_id: athleteId });
      setRows(((data as any[]) || []) as Row[]);
      setLoading(false);
    })();
  }, [athleteId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  const data = rows.map((r) => ({
    name: r.test_name,
    athlete: Number(r.athlete_value),
    median: Number(r.club_median),
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <BarChart3 className="h-4 w-4" /> {t("compareToClub")}
      </h4>
      <p className="text-xs text-muted-foreground">{t("compareToClubDesc")}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="athlete" name={t("athlete")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="median" name={t("clubMedian")} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
