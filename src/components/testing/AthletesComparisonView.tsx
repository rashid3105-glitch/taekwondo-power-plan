// Coach view: pick a test → show the latest result for every athlete in the
// active club, sorted by the test's `direction` ("best first").

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { Loader2, Trophy, Users } from "lucide-react";
import {
  TEST_CATALOG,
  type TestDefinition,
  findTestByDbName,
  localizedTestName,
} from "@/lib/testCatalog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TestCatalogPicker } from "./TestCatalogPicker";
import { Button } from "@/components/ui/button";

interface Row {
  athlete_id: string;
  display_name: string;
  value: number;
  unit: string;
  test_date: string;
}

export function AthletesComparisonView() {
  const { t, locale } = useLanguage();
  const { activeClubId } = useActiveClub();
  const [selected, setSelected] = useState<TestDefinition | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) {
      setRows([]);
      return;
    }
    void load(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, activeClubId]);

  async function load(def: TestDefinition) {
    setLoading(true);
    // Determine all DB names that map to this catalog entry (legacy + canonical)
    const dbNames = Array.from(
      new Set([
        def.dbTestName,
        ...TEST_CATALOG.filter((c) => c.id === def.id).map((c) => c.dbTestName),
      ]),
    );

    // Strictly scoped to the active club — atleter fra andre klubber må aldrig optræde.
    const { data: userRes } = await supabase.auth.getUser();
    const coachId = userRes.user?.id;
    if (!coachId) { setLoading(false); return; }

    if (!activeClubId) {
      // No club selected → show empty state instead of leaking cross-club athletes.
      setRows([]);
      setLoading(false);
      return;
    }

    const { data: members } = await supabase
      .from("club_memberships")
      .select("user_id")
      .eq("club_id", activeClubId)
      .eq("status", "active");
    const athleteIds = (members || []).map((m: any) => m.user_id).filter((id) => id !== coachId);
    if (athleteIds.length === 0) { setRows([]); setLoading(false); return; }


    const { data: results } = await supabase
      .from("physical_test_results")
      .select("user_id, value, unit, test_date")
      .in("user_id", athleteIds)
      .in("test_name", dbNames)
      .order("test_date", { ascending: false });

    // Take latest per athlete
    const latestByUser = new Map<string, { value: number; unit: string; test_date: string }>();
    for (const r of (results || []) as any[]) {
      if (!latestByUser.has(r.user_id)) {
        latestByUser.set(r.user_id, { value: Number(r.value), unit: r.unit, test_date: r.test_date });
      }
    }
    if (latestByUser.size === 0) { setRows([]); setLoading(false); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", Array.from(latestByUser.keys()));
    const nameById = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name || "—"]));

    const combined: Row[] = Array.from(latestByUser.entries()).map(([uid, v]) => ({
      athlete_id: uid,
      display_name: nameById.get(uid) || "—",
      value: v.value,
      unit: v.unit,
      test_date: v.test_date,
    }));

    setRows(combined);
    setLoading(false);
  }

  const sortedRows = useMemo(() => {
    if (!selected) return [];
    const direction = selected.direction;
    return [...rows].sort((a, b) =>
      direction === "lower_is_better" ? a.value - b.value : b.value - a.value,
    );
  }, [rows, selected]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> {t("ptComparisonTitle")}
        </h3>
        <p className="text-xs text-muted-foreground">{t("ptComparisonDesc")}</p>
        <Button variant="outline" onClick={() => setPickerOpen(true)} className="w-full sm:w-auto">
          {selected ? localizedTestName(selected, locale) : t("ptPickTestPrompt")}
        </Button>
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h4 className="font-semibold text-sm text-card-foreground">
              {localizedTestName(selected, locale)}
            </h4>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {selected.direction === "lower_is_better" ? t("ptDirection_lower") : t("ptDirection_higher")}
            </span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : sortedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("ptNoComparisonData")}</p>
          ) : (
            <ol className="divide-y divide-border/60">
              {sortedRows.map((r, i) => (
                <li key={r.athlete_id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      i === 0 ? "bg-amber-500/20 text-amber-600" :
                      i === 1 ? "bg-zinc-400/20 text-zinc-500" :
                      i === 2 ? "bg-orange-700/20 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="text-sm font-medium text-card-foreground truncate">{r.display_name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold tabular-nums text-card-foreground">
                      {r.value} <span className="text-xs text-muted-foreground font-normal">{r.unit}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(r.test_date).toLocaleDateString(locale)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogTitle>{t("ptPickTestPrompt")}</DialogTitle>
          <TestCatalogPicker
            onPick={(d) => { setSelected(d); setPickerOpen(false); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
