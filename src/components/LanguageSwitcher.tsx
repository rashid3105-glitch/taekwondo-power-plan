import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div className={cn("inline-flex items-center rounded-md border border-border bg-muted p-0.5 text-xs", className)}>
      <button
        onClick={() => setLocale("en")}
        className={cn(
          "px-2 py-1 rounded-sm font-semibold transition-colors cursor-pointer",
          locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLocale("da")}
        className={cn(
          "px-2 py-1 rounded-sm font-semibold transition-colors cursor-pointer",
          locale === "da" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        DA
      </button>
    </div>
  );
}
