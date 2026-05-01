// Coach-side manual entry of a post-competition reflection on behalf of an athlete.
// Used when the athlete shared their answers verbally or their offline reflection
// is stuck on their device. Calls the coach-create-reflection edge function which
// validates the coach->athlete relationship server-side.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const RATING_KEYS = [
  "overallPerformance", "mentalReadiness", "focusDuringMatches", "emotionalControl",
  "tacticalExecution", "physicalCondition", "recoveryBetweenMatches", "postCompMood",
] as const;
const REFLECTION_KEYS = [
  "wentWell", "didntGoWell", "biggestLearning", "whatIdDoDifferently", "mentalTriggers",
] as const;

interface Competition {
  id: string;
  name: string;
  event_date: string;
  result: string | null;
}

interface Props {
  athleteId: string;
  athleteName?: string;
  onCreated?: () => void;
}

export function CoachManualReflectionDialog({ athleteId, athleteName, onCreated }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionId, setCompetitionId] = useState<string>("");
  const [resultText, setResultText] = useState("");
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, name, event_date, result")
        .eq("user_id", athleteId)
        .order("event_date", { ascending: false });
      setCompetitions((data as Competition[]) || []);
    })();
  }, [open, athleteId]);

  function reset() {
    setCompetitionId("");
    setResultText("");
    setRatings({});
    setReflections({});
  }

  function pickCompetition(id: string) {
    setCompetitionId(id);
    const c = competitions.find((x) => x.id === id);
    if (c?.result) setResultText(c.result);
  }

  async function save() {
    const comp = competitions.find((c) => c.id === competitionId);
    if (!comp) return;
    setSaving(true);
    try {
      const ratingPayload: Record<string, number> = {};
      RATING_KEYS.forEach((k) => {
        const n = Number(ratings[k]);
        if (Number.isFinite(n) && n >= 1 && n <= 10) ratingPayload[k] = Math.round(n);
      });
      const reflectionPayload: Record<string, string> = {};
      REFLECTION_KEYS.forEach((k) => {
        const v = (reflections[k] || "").trim();
        if (v) reflectionPayload[k] = v.slice(0, 1000);
      });

      const { data, error } = await supabase.functions.invoke("coach-create-reflection", {
        body: {
          athlete_id: athleteId,
          competition_id: comp.id,
          competition_name: comp.name,
          competition_date: comp.event_date,
          result: resultText.slice(0, 200) || comp.result || null,
          ratings: ratingPayload,
          reflections: reflectionPayload,
        },
      });
      if (error || (data as any)?.error) {
        throw new Error((data as any)?.error || error?.message || "Failed");
      }
      toast({ title: t("coachManualReflectionSaved") });
      setOpen(false);
      reset();
      onCreated?.();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 px-2 text-[11px] gap-1">
          <Plus className="h-3 w-3" /> {t("coachManualReflectionOpen")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("coachManualReflectionTitle")}{athleteName ? ` – ${athleteName}` : ""}</DialogTitle>
          <DialogDescription className="text-xs">
            {t("coachManualReflectionDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("coachManualReflectionCompetition")}</Label>
            <Select value={competitionId} onValueChange={pickCompetition}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t("coachManualReflectionPickCompetition")} />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.event_date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("coachManualReflectionResult")}</Label>
            <Input value={resultText} onChange={(e) => setResultText(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("coachManualReflectionRatings")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {RATING_KEYS.map((k) => (
                <div key={k} className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">{t(`reflectionRating_${k}` as any)}</div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={10}
                    value={ratings[k] ?? ""}
                    onChange={(e) => setRatings((p) => ({ ...p, [k]: e.target.value }))}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t("coachManualReflectionAnswers")}</Label>
            {REFLECTION_KEYS.map((k) => (
              <div key={k} className="space-y-1">
                <div className="text-[10px] text-muted-foreground">{t(`reflectionPrompt_${k}` as any)}</div>
                <Textarea
                  rows={2}
                  maxLength={1000}
                  value={reflections[k] ?? ""}
                  onChange={(e) => setReflections((p) => ({ ...p, [k]: e.target.value }))}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={!competitionId || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
