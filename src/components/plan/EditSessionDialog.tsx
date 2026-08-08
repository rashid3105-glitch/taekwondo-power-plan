import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import type { PlanSession } from "@/lib/planSessionUtils";

const TYPES: PlanSession["type"][] = ["tkd", "gym", "recovery", "rest"];
const TYPE_KEY: Record<string, string> = {
  tkd: "sessionTypeTechnique",
  gym: "sessionTypeStrength",
  recovery: "sessionTypeRecovery",
  rest: "sessionTypeRest",
};

interface Props {
  open: boolean;
  onClose: () => void;
  session: PlanSession | null;
  onSave: (patch: { type: PlanSession["type"]; label: string; focus: string }) => void;
}

export function EditSessionDialog({ open, onClose, session, onSave }: Props) {
  const { t } = useLanguage();
  const [type, setType] = useState<PlanSession["type"]>("gym");
  const [label, setLabel] = useState("");
  const [focus, setFocus] = useState("");

  useEffect(() => {
    if (open && session) {
      setType((session.type as PlanSession["type"]) || "gym");
      setLabel(session.label || "");
      setFocus(session.focus || "");
    }
  }, [open, session]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{t("planEditSession")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>{t("planSessionType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as PlanSession["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((tp) => (
                  <SelectItem key={tp} value={tp}>{t(TYPE_KEY[tp])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("planSessionLabel")}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value.slice(0, 80))} />
          </div>
          <div>
            <Label>{t("planSessionFocus")}</Label>
            <Textarea rows={2} value={focus} onChange={(e) => setFocus(e.target.value.slice(0, 300))} maxLength={300} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>{t("cancel")}</Button>
          <Button size="sm" onClick={() => { onSave({ type, label, focus }); onClose(); }}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
