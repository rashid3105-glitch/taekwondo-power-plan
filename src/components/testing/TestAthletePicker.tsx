// Athlete multi-select dialog body (matches Beep Test picker styling).
// Coach picks which athletes a given test should run for, then starts.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Athlete {
  athlete_id: string;
  display_name: string;
}

interface Props {
  title: string;
  subtitle?: string;
  athletes: Athlete[];
  initialSelected?: Set<string>;
  onStart: (ids: string[]) => void;
}

export function TestAthletePicker({ title, subtitle, athletes, initialSelected, onStart }: Props) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected ?? []),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    if (selected.size === athletes.length) setSelected(new Set());
    else setSelected(new Set(athletes.map((a) => a.athlete_id)));
  }

  return (
    <div className="space-y-4 py-1">
      <div>
        <h2 className="text-lg font-extrabold text-foreground leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> {t("ptSelectAthletes")}
            {selected.size > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({selected.size} {t("ptSelectedCount")})
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {selected.size === athletes.length ? t("beepTestDeselectAll") : t("ptSelectAll")}
          </button>
        </div>
        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("ptNoAthletes")}</p>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border max-h-64 overflow-y-auto">
            {athletes.map((a) => (
              <label
                key={a.athlete_id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
              >
                <Checkbox
                  checked={selected.has(a.athlete_id)}
                  onCheckedChange={() => toggle(a.athlete_id)}
                />
                <span className="text-sm font-medium text-foreground">{a.display_name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => onStart(Array.from(selected))}
        size="lg"
        disabled={selected.size === 0}
        className="w-full h-12 text-base font-bold"
      >
        {t("ptStartTest")}
        {selected.size > 0 && (
          <span className="ml-2 opacity-80 text-sm font-semibold">
            ({selected.size})
          </span>
        )}
      </Button>
    </div>
  );
}
