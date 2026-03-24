import { useLanguage } from "@/i18n/LanguageContext";

export const AppFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/50 py-5 space-y-1">
      <p className="text-center text-[11px] text-muted-foreground tracking-wide">
        Made for More. Built to Perform.
      </p>
      <p className="text-center text-[10px] text-muted-foreground/60">
        sportstalent.dk © F. Rashid
      </p>
    </footer>
  );
};
