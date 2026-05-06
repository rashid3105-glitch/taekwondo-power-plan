import { useLanguage } from "@/i18n/LanguageContext";
import { getDailyQuote, type Locale } from "@/data/motivationalQuotes";
import { Quote as QuoteIcon } from "lucide-react";

export function HubDailyQuote() {
  const { t, locale } = useLanguage();
  const lang: Locale = (["en", "da", "sv", "de", "ar", "no"].includes(locale) ? locale : "en") as Locale;
  const q = getDailyQuote(lang);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border border-l-[3px] border-l-tab-mental bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-card">
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-9 w-9 rounded-full bg-tab-mental/10 flex items-center justify-center">
          <QuoteIcon className="h-4 w-4 text-tab-mental" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-tab-mental">
            {t("dailyQuoteTitle")}
          </p>
          <p className="mt-1 text-sm sm:text-base font-medium text-foreground leading-snug italic">
            “{q.text}”
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">— {q.author}</p>
        </div>
      </div>
    </div>
  );
}
