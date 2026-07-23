import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "coach.athleteDetail.panels.v1";

function readState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(id: string, open: boolean) {
  try {
    const cur = readState();
    cur[id] = open;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cur));
  } catch {
    // ignore
  }
}

interface Props {
  id: string;
  title: ReactNode;
  /** Right-aligned content in the header (e.g. Save button). Rendered outside the toggle. */
  headerAction?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsiblePanel({
  id,
  title,
  headerAction,
  defaultOpen = false,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState<boolean>(() => {
    const saved = readState();
    return id in saved ? !!saved[id] : defaultOpen;
  });

  useEffect(() => {
    writeState(id, open);
  }, [id, open]);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-card group-disabled:opacity-70 overflow-hidden",
        className,
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 p-4 sm:p-5">
          <CollapsibleTrigger
            className="flex items-center gap-2 flex-1 min-w-0 text-left group/trigger"
            aria-label={typeof title === "string" ? title : undefined}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
            <span className="font-semibold text-sm text-foreground flex items-center gap-2 min-w-0">
              {title}
            </span>
          </CollapsibleTrigger>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
        <CollapsibleContent>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
