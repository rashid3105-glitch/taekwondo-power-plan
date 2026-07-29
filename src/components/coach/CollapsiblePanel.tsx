import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  title: string;
  icon?: LucideIcon;
  iconClass?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CollapsiblePanel({
  title,
  icon: Icon,
  iconClass = "text-primary",
  defaultOpen = false,
  action,
  children,
  className,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-card overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          {Icon && <Icon className={cn("h-4 w-4 shrink-0", iconClass)} />}
          <span className="font-semibold text-sm text-foreground truncate">{title}</span>
        </button>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </div>
      {open && <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">{children}</div>}
    </div>
  );
}
