import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { localizeDayOfWeek } from "@/lib/planTranslation";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Full weekly schedule (plan days) */
  days: any[];
  /** Day index that is the source — cannot be a target */
  sourceDayIndex: number;
  onConfirm: (targetDayIndexes: number[], mode: "append" | "replace") => void;
}

export function CopyToDaysDialog({ open, onClose, title, days, sourceDayIndex, onConfirm }: Props) {
  const { t, locale } = useLanguage();
  const [selected, setSelected] = useState<number[]>([]);
  const [mode, setMode] = useState<"append" | "replace">("append");

  useEffect(() => {
    if (open) {
      setSelected([]);
      setMode("append");
    }
  }, [open]);

  const toggle = (i: number) =>
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            {t("planCopyChooseDays")}
          </p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {days.map((day: any, i: number) => {
              if (i === sourceDayIndex) return null;
              const checked = selected.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    checked ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:bg-secondary/60"
                  )}
                >
                  <Checkbox checked={checked} className="pointer-events-none h-4 w-4" />
                  <span className="text-sm font-semibold text-foreground">
                    {localizeDayOfWeek(day?.dayOfWeek, locale)}
                  </span>
                  <span className="ml-auto truncate text-xs text-muted-foreground max-w-[45%]">
                    {day?.label || ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-0.5">
          {(["append", "replace"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "append" ? t("planCopyAppend") : t("planCopyReplace")}
            </button>
          ))}
        </div>
        <Label className="text-[11px] text-muted-foreground font-normal">
          {mode === "append" ? t("planCopyAppendHint") : t("planCopyReplaceHint")}
        </Label>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>{t("cancel")}</Button>
          <Button
            size="sm"
            disabled={selected.length === 0}
            onClick={() => { onConfirm(selected, mode); onClose(); }}
          >
            {t("planCopyConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
