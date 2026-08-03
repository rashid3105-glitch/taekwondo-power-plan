import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export function StepShell({
  title,
  help,
  children,
  footer,
}: {
  title: string;
  help?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2.5">{children}</div>
      {footer}
      {help && <p className="text-xs text-muted-foreground text-center pt-1">{help}</p>}
    </div>
  );
}

interface Option {
  value: string;
  label: string;
  hint?: string;
}

export function ChoiceList({
  options,
  value,
  onSelect,
  columns = 1,
}: {
  options: Option[];
  value: string | null;
  onSelect: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-2.5", columns === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            className={cn(
              "w-full rounded-xl border px-4 py-4 text-left transition-colors min-h-[56px]",
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            <span className="text-sm font-semibold">{o.label}</span>
            {o.hint && <span className="block text-[11px] text-muted-foreground mt-0.5">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function MultiList({
  options,
  values,
  onToggle,
}: {
  options: Option[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid gap-2.5">
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={cn(
              "w-full rounded-xl border px-4 py-4 text-left transition-colors min-h-[56px] flex items-center gap-3",
              active
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-md border flex items-center justify-center shrink-0",
                active ? "bg-primary border-primary" : "border-border",
              )}
            >
              {active && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
            </span>
            <span className="text-sm font-semibold text-foreground">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function NumberStep({
  value,
  onChange,
  suffix,
  step = "1",
  onContinue,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: string;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 text-lg font-bold pr-16"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <Button className="w-full h-12 font-bold" onClick={onContinue} disabled={disabled}>
        {t("woContinue")}
      </Button>
    </div>
  );
}
