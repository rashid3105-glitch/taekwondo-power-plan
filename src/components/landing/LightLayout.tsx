import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { isNativeApp } from "@/lib/platform";

// CSS owns the public palette; these aliases support existing inline layouts.
export const LIGHT = {
  bg: "hsl(var(--background))", soft: "hsl(var(--muted))", ink: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))", line: "hsl(var(--border))",
  blue: "hsl(var(--primary))", gold: "hsl(var(--accent))",
};

export function LightLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const links = [
    { label: t("navHome"), href: "/" },
    { label: t("navPlatform"), href: "/platform" },
    { label: t("navFeatures"), href: "/funktioner" },
    ...(isNativeApp() ? [] : [{ label: t("navPricing"), href: "/priser" }]),
    { label: t("navAbout"), href: "/about" },
    { label: t("navBlog"), href: "/blog" },
  ];
  const footerLinks = [
    ...links.filter(l => l.href !== "/"),
    { label: t("homeFooterPrivacy"), href: "/privacy" },
    { label: t("homeFooterTerms"), href: "/terms" },
    ...(isNativeApp() ? [] : [{ label: t("homeFooterContact"), href: "/contact" }]),
  ];
  return (
    <div className="theme-public-light min-h-screen flex flex-col" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-3">
          <Link to="/" aria-label={t("navHome")} className="shrink-0"><BrandLogo height={32} textColor={LIGHT.ink} accentColor={LIGHT.gold} /></Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Button asChild variant="outline" className="text-xs sm:text-sm"><Link to="/auth">{t("signIn")}</Link></Button>
            <Button variant="ghost" size="icon" className="sm:hidden" aria-label={t("menu")} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</Button>
          </div>
        </div>
        <nav className={`${open ? "flex" : "hidden"} sm:flex flex-wrap justify-center gap-2 px-5 pb-3`}>
          {links.map(l => <Button key={l.href} asChild variant="ghost" className={location.pathname === l.href ? "text-primary bg-muted" : "text-muted-foreground"}><Link to={l.href} onClick={() => setOpen(false)} aria-current={location.pathname === l.href ? "page" : undefined}>{l.label}</Link></Button>)}
        </nav>
      </header>
      <main className="public-content flex-1">{children}</main>
      <footer className="border-t border-border bg-muted">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-5 gap-y-2">{footerLinks.map(l => <Link key={l.href} to={l.href} className="py-2 hover:text-primary">{l.label}</Link>)}</div>
          <div>© Sportstalent.dk · CVR 33685815</div>
        </div>
      </footer>
    </div>
  );
}
