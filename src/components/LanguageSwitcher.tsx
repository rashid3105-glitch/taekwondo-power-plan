import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/translations";

const FLAGS: Record<Locale, { emoji: string; label: string }> = {
  en: { emoji: "🇬🇧", label: "English" },
  da: { emoji: "🇩🇰", label: "Dansk" },
  sv: { emoji: "🇸🇪", label: "Svenska" },
  de: { emoji: "🇩🇪", label: "Deutsch" },
  ar: { emoji: "🇸🇦", label: "العربية" },
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-accent cursor-pointer"
      >
        <span className="text-base leading-none">{FLAGS[locale].emoji}</span>
        <span className="text-xs text-muted-foreground">{FLAGS[locale].label}</span>
        <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-border bg-popover shadow-md py-1">
          {(Object.keys(FLAGS) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer hover:bg-accent",
                l === locale && "bg-accent font-semibold"
              )}
            >
              <span className="text-base leading-none">{FLAGS[l].emoji}</span>
              <span>{FLAGS[l].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
