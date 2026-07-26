import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toISODate } from "@/lib/runningProgram";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

export function LogRunDialog({ open, onOpenChange, onSaved }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [date, setDate] = useState(toISODate(new Date()));
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [calories, setCalories] = useState("");
  const [saving, setSaving] = useState(false);

  const dist = parseFloat(distance.replace(",", ".")) || 0;
  const totalSec = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
  const pace = dist > 0 && totalSec > 0 ? Math.round(totalSec / dist) : 0;

  async function handleSave() {
    if (dist <= 0) {
      toast({ title: t("error"), description: t("runLogDistanceRequired"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      const { error } = await supabase.from("diary_entries").insert({
        user_id: user.id,
        entry_date: date,
        content: `${dist} km`,
        entry_type: "running",
        entry_types: ["running"],
        run_distance_km: dist,
        run_duration_seconds: totalSec > 0 ? totalSec : null,
        run_pace_seconds_per_km: pace > 0 ? pace : null,
        run_calories: parseInt(calories, 10) > 0 ? parseInt(calories, 10) : null,
      });
      if (error) throw error;
      toast({ title: t("runLogSaved") });
      setDistance(""); setMinutes(""); setSeconds(""); setCalories("");
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("runLogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs" htmlFor="runDate">{t("date")}</Label>
            <Input id="runDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs" htmlFor="runDist">{t("runDistanceKm")}</Label>
            <Input id="runDist" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="5.0" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs" htmlFor="runMin">{t("runMinutes")}</Label>
              <Input id="runMin" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="30" />
            </div>
            <div>
              <Label className="text-xs" htmlFor="runSec">{t("runSeconds")}</Label>
              <Input id="runSec" inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} placeholder="00" />
            </div>
          </div>
          <div>
            <Label className="text-xs" htmlFor="runCal">{t("runCalories")}</Label>
            <Input id="runCal" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="—" />
          </div>
          {pace > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("runPace")}: {Math.floor(pace / 60)}:{(pace % 60).toString().padStart(2, "0")}/km
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
