import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { BirthDatePicker } from "@/components/BirthDatePicker";
import { ageFromBirthDate } from "@/lib/age";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  athleteId: string;
  athleteName?: string | null;
  clubId?: string | null;
  currentBirthDate?: string | null;
  onSaved?: (isoDate: string, age: number) => void;
  trigger?: React.ReactNode;
}

/** Coach-facing dialog to fill in a missing (or wrong) athlete date of birth. */
export function SetBirthDateDialog({
  athleteId, athleteName, clubId, currentBirthDate, onSaved, trigger,
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentBirthDate || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const age = ageFromBirthDate(value);
    if (!value || age == null || age < 3 || age > 100) {
      toast.error(t("birthDateInvalid"));
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("consent-coach-actions", {
      body: {
        action: "set_birth_date",
        athlete_id: athleteId,
        birth_date: value,
        ...(clubId ? { club_id: clubId } : {}),
      },
    });
    setSaving(false);
    if (error || !(data as any)?.ok) {
      toast.error(t("birthDateInvalid"));
      return;
    }
    toast.success(t("coachBirthDateSaved"));
    onSaved?.(value, age);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="h-8" title={t("coachSetBirthDate")}>
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            {t("coachSetBirthDate")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t("coachSetBirthDate")}{athleteName ? ` — ${athleteName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <BirthDatePicker value={value} onChange={setValue} />
        <Button onClick={save} disabled={saving || !value} className="w-full h-11">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("birthDateGateCta")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
