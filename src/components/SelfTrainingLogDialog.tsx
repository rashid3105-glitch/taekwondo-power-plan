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
import { Loader2, User as UserIcon, Trash2 } from "lucide-react";
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

export interface SelfLogEditTarget {
  id: string;
  logged_date: string;
  activity_label: string | null;
  duration_minutes: number | null;
  rpe: number | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: () => void;
  /** When provided, the dialog opens in edit mode for that workout_logs row. */
  existingLog?: SelfLogEditTarget | null;
}

export function SelfTrainingLogDialog({ open, onOpenChange, onLogged, existingLog }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!existingLog;

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [types, setTypes] = useState<string[]>(FALLBACK_TYPES);
  const [clubId, setClubId] = useState<string | null>(null);

  const [date, setDate] = useState(today);
  const [activity, setActivity] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [rpe, setRpe] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Preload either existing values (edit) or defaults (create).
    if (existingLog) {
      setDate(existingLog.logged_date);
      setActivity(existingLog.activity_label || "");
      setDuration(existingLog.duration_minutes != null ? String(existingLog.duration_minutes) : "");
      setRpe(existingLog.rpe != null ? String(existingLog.rpe) : "");
      setNotes(existingLog.notes || "");
    } else {
      setDate(today);
      setActivity("");
      setDuration("");
      setRpe("");
      setNotes("");
    }

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
        const rows = (data as unknown as ClubActivityType[] | null) || [];
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
  }, [open, existingLog?.id]);

  useEffect(() => {
    if (types.length === 0) return;
    // If the existing log's activity is no longer in the active list, keep it visible.
    if (activity && !types.includes(activity)) {
      setTypes((prev) => (prev.includes(activity) ? prev : [activity, ...prev]));
      return;
    }
    if (!activity) {
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

    if (isEdit && existingLog) {
      // Update — RLS scopes to owner and we additionally guard entry_type='self'.
      const { error } = await supabase
        .from("workout_logs")
        .update({
          activity_label: activity,
          logged_date: date,
          duration_minutes: dur,
          rpe: rpeNum,
          notes: notes.trim() || null,
        } as any)
        .eq("id", existingLog.id)
        .eq("user_id", user.id)
        .eq("entry_type", "self");

      setSaving(false);
      if (error) {
        toast({ title: t("error"), description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: t("selfLogUpdated") || "Egen træning opdateret" });
    } else {
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
    }

    onOpenChange(false);
    onLogged?.();
  };

  const remove = async () => {
    if (!existingLog) return;
    const confirmMsg = t("selfLogDeleteConfirm") || "Slet denne egen-træning?";
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    haptics.tap();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setDeleting(false);
      toast({ title: t("error"), variant: "destructive" });
      return;
    }

    // Owner + self-type guard (RLS already enforces owner).
    const { error } = await supabase
      .from("workout_logs")
      .delete()
      .eq("id", existingLog.id)
      .eq("user_id", user.id)
      .eq("entry_type", "self");

    setDeleting(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("selfLogDeleted") || "Egen træning slettet" });
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-self" />
            {isEdit
              ? t("selfLogEditTitle") || "Rediger egen træning"
              : t("selfLogTitle") || "Log egen træning"}
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

          <div className="flex justify-between gap-2 pt-2">
            <div>
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={remove}
                  disabled={saving || deleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      {t("selfLogDelete") || "Slet"}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
                {t("cancel")}
              </Button>
              <Button
                onClick={save}
                disabled={saving || deleting}
                className="bg-self text-self-foreground hover:bg-self/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
