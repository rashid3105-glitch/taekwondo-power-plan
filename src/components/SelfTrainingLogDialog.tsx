import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { haptics } from "@/lib/haptics";

interface ClubActivityType {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

const FALLBACK_TYPES = ["Taekwondo", "Styrke", "Kondisjon", "Andet"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: () => void;
}

export function SelfTrainingLogDialog({ open, onOpenChange, onLogged }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [types, setTypes] = useState<string[]>(FALLBACK_TYPES);
  const [clubId, setClubId] = useState<string | null>(null);

  const [date, setDate] = useState(today);
  const [activity, setActivity] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [rpe, setRpe] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(today);
    setDuration("");
    setRpe("");
    setNotes("");

    (async () => {
      setLoadingTypes(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingTypes(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const cid = (prof as any)?.club_id ?? null;
      setClubId(cid);

      if (cid) {
        const { data } = await supabase
          .from("club_activity_types" as any)
          .select("id, label, sort_order, is_active")
          .eq("club_id", cid)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        const rows = (data as ClubActivityType[] | null) || [];
        if (rows.length > 0) {
          setTypes(rows.map((r) => r.label));
        } else {
          setTypes(FALLBACK_TYPES);
        }
      } else {
        setTypes(FALLBACK_TYPES);
      }
      setLoadingTypes(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (types.length > 0 && !types.includes(activity)) {
      setActivity(types[0]);
    }
  }, [types, activity]);

  const save = async () => {
    if (!activity) {
      toast({ title: t("selfLogPickActivity") || "Vælg aktivitet", variant: "destructive" });
      return;
    }
    const dur = parseInt(duration, 10);
    if (!Number.isFinite(dur) || dur <= 0) {
      toast({ title: t("selfLogPickDuration") || "Angiv varighed i minutter", variant: "destructive" });
      return;
    }
    const rpeNum = rpe ? parseInt(rpe, 10) : null;
    if (rpeNum !== null && (!Number.isFinite(rpeNum) || rpeNum < 1 || rpeNum > 10)) {
      toast({ title: t("selfLogRpeRange") || "RPE skal være 1-10", variant: "destructive" });
      return;
    }

    setSaving(true);
    haptics.tap();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      toast({ title: t("error"), variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      entry_type: "self",
      activity_label: activity,
      completed: true,
      logged_date: date,
      duration_minutes: dur,
      rpe: rpeNum,
      notes: notes.trim() || null,
      club_id: clubId,
    } as any);

    setSaving(false);

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: t("selfLogSaved") || "Egen træning logget" });
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-self" />
            {t("selfLogTitle") || "Log egen træning"}
          </DialogTitle>
          <DialogDescription>
            {t("selfLogDesc") || "Logger en session der ikke kommer fra din plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="self-date">{t("date") || "Dato"}</Label>
            <Input
              id="self-date"
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("selfLogActivity") || "Aktivitet"}</Label>
            {loadingTypes ? (
              <div className="h-11 rounded-md border border-input bg-muted/30 flex items-center px-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={activity} onValueChange={setActivity}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="self-duration">{t("selfLogDuration") || "Varighed (min)"}</Label>
              <Input
                id="self-duration"
                type="number"
                inputMode="numeric"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="self-rpe">{t("selfLogRpe") || "RPE 1-10"}</Label>
              <Input
                id="self-rpe"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="—"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="self-notes">{t("selfLogNotes") || "Notat (valgfrit)"}</Label>
            <Textarea
              id="self-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder=""
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button onClick={save} disabled={saving} className="bg-self text-self-foreground hover:bg-self/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
