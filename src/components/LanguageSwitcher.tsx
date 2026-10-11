import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/translations";

const FLAGS: Record<Locale, { emoji: string; label: string }> = {
  en: { emoji: "🇬🇧", label: "English" },
  da: { emoji: "🇩🇰", label: "Dansk" },
  sv: { emoji: "🇸🇪", label: "Svenska" },
  no: { emoji: "🇳🇴", label: "Norsk" },
  de: { emoji: "🇩🇪", label: "Deutsch" },
  ar: { emoji: "🇸🇦", label: "العربية" },
  es: { emoji: "🇪🇸", label: "Español" },
};

const DARK = {
  button: { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(212,175,55,0.45)", color: "#D4AF37" },
  menu: { background: "#11131d", border: "0.5px solid rgba(212,175,55,0.3)", color: "#fff" },
} as const;

export function LanguageSwitcher({ className, compact, variant = "default" }: { className?: string; compact?: boolean; variant?: "default" | "dark" }) {
  const dark = variant === "dark";
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
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-md transition-colors cursor-pointer min-h-9",
          !dark && "border border-border bg-muted hover:bg-accent",
          compact ? "px-2 py-1.5" : "px-2.5 py-1.5 text-sm font-semibold"
        )}
        style={dark ? DARK.button : undefined}
        aria-label={FLAGS[locale].label}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none" aria-hidden>{FLAGS[locale].emoji}</span>
        {compact
          ? <span className={cn("text-[11px] font-bold uppercase", !dark && "text-foreground")}>{locale}</span>
          : <span className={cn("text-xs", !dark && "text-muted-foreground")}>{FLAGS[locale].label}</span>}
        <svg className={cn(!dark && "text-muted-foreground", "h-3 w-3")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className={cn("absolute end-0 top-full mt-1 z-[110] min-w-[160px] rounded-md shadow-md py-1", !dark && "border border-border bg-popover text-popover-foreground")}
          style={dark ? DARK.menu : undefined}
        >
          {(Object.keys(FLAGS) as Locale[]).map((l) => (
            <button
              type="button"
              role="option"
              aria-selected={l === locale}
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 px-3 min-h-11 text-sm transition-colors cursor-pointer",
                dark
                  ? (l === locale ? "font-semibold bg-white/10" : "hover:bg-white/5")
                  : cn("text-popover-foreground hover:bg-accent hover:text-accent-foreground", l === locale && "bg-accent text-accent-foreground font-semibold")
              )}
              style={dark && l === locale ? { color: "#D4AF37" } : undefined}
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
