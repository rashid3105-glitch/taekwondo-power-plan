import { Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  /** "full" = the complete legal note, "short" = the persistent inline marker. */
  variant?: "full" | "short";
  className?: string;
}

/**
 * Visible transparency note for the automated assistant features
 * (EU AI Act art. 50 — applicable from 2 Aug 2026).
 * Must stay visible in the interaction itself, not only in the privacy policy.
 */
export function AssistantDisclosure({ variant = "full", className }: Props) {
  const { t } = useLanguage();

  if (variant === "short") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground",
          className,
        )}
      >
        <Info className="h-2.5 w-2.5 shrink-0" />
        {t("assistantDisclosureShort" as any)}
      </span>
    );
  }

  return (
    <p
      className={cn(
        "flex items-start gap-1.5 rounded-md border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
      <span>{t("assistantDisclosure" as any)}</span>
    </p>
  );
}

export default AssistantDisclosure;
