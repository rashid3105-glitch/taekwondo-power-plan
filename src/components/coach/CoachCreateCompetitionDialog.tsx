// Coach-side dialog for creating a competition on behalf of a managed athlete.
// Calls the `create-athlete-competition` edge function (service-role insert,
// authorized by coach_athletes link).

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  athleteId: string;
  athleteName: string;
  onCreated?: () => void;
  triggerLabel?: string;
}

export function CoachCreateCompetitionDialog({ athleteId, athleteName, onCreated, triggerLabel }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [priority, setPriority] = useState<"A" | "B" | "C">("A");
  const [location, setLocation] = useState("");

  function reset() {
    setName(""); setDate(""); setWeightClass(""); setLocation(""); setPriority("A");
  }

  async function submit() {
    if (!name || !date) {
      toast({ title: t("competitionsNameDateRequired"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-athlete-competition", {
        body: {
          athlete_id: athleteId,
          name,
          event_date: date,
          weight_class_kg: weightClass ? parseFloat(weightClass) : null,
          priority,
          location: location || null,
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({ title: t("competitionsCreated"), description: athleteName });
      reset();
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          {triggerLabel ?? t("coachCreateCompetition")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> {t("coachCreateCompetitionFor")} {athleteName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t("competitionsName")} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nordic Open" maxLength={120} />
          </div>
          <div>
            <Label className="text-xs">{t("competitionsDate")} *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">{t("competitionsWeightClass")}</Label>
            <Input
              type="number" inputMode="decimal" step="0.1"
              value={weightClass} onChange={(e) => setWeightClass(e.target.value)}
              placeholder="67.5"
            />
          </div>
          <div>
            <Label className="text-xs">{t("competitionsPriority")}</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">{t("competitionsPriorityA")}</SelectItem>
                <SelectItem value="B">{t("competitionsPriorityB")}</SelectItem>
                <SelectItem value="C">{t("competitionsPriorityC")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("competitionsLocation")}</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} placeholder={t("competitionsLocationPlaceholder")} />
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            {t("competitionsCreate")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
