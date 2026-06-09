import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface FeatureEmptyStateProps {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  ctaKey?: string;
  onCta?: () => void;
  accentClass?: string; // tailwind text color e.g. text-tab-plan
  iconBgClass?: string; // tailwind bg color e.g. bg-tab-plan/15
}

export function FeatureEmptyState({
  icon: Icon,
  titleKey,
  descKey,
  ctaKey,
  onCta,
  accentClass = "text-muted-foreground",
  iconBgClass = "bg-muted/40",
}: FeatureEmptyStateProps) {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-border bg-card p-8 sm:p-12 text-center shadow-card">
      <div
        className={cn(
          "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl",
          iconBgClass
        )}
      >
        <Icon className={cn("h-8 w-8", accentClass)} strokeWidth={1.5} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-card-foreground mb-2">
        {t(titleKey) || titleKey}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-5">
        {t(descKey) || descKey}
      </p>
      {ctaKey && onCta && (
        <Button onClick={onCta} size="sm" className="h-11 sm:h-9 px-5">
          {t(ctaKey) || ctaKey}
        </Button>
      )}
    </div>
  );
}
