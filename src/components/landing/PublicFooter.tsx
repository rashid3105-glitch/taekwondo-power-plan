import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { isNativeApp } from "@/lib/platform";

export function PublicFooter() {
  const { t, locale } = useLanguage();
  const links = [
    { label: t("navHome"), href: "/" },
    { label: t("navPlatform"), href: "/platform" },
    { label: t("navFeatures"), href: "/funktioner" },
    ...(isNativeApp() ? [] : [{ label: t("navPricing"), href: "/priser" }]),
    { label: t("navAbout"), href: "/about" },
    { label: t("navMethodology"), href: "/methodology" },
    { label: t("navPrograms"), href: "/programs" },
    { label: t("navBlog"), href: "/blog" },
    { label: t("homeHeroCtaAnalysis"), href: "/klubanalyse" },
    ...(isNativeApp() ? [] : [{ label: t("homeFooterContact"), href: "/contact" }]),
    { label: t("homeFooterTerms"), href: "/terms" },
    { label: t("homeFooterPrivacy"), href: "/privacy" },
  ];

  return (
    <footer className="theme-public-light border-t border-border bg-muted pb-safe" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground sm:px-8">
        <nav aria-label={t("publicNavigation")} className="grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {links.map(link => <Link key={link.href} to={link.href} className="flex min-h-11 items-center py-2 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{link.label}</Link>)}
        </nav>
        <div className="mt-6 border-t border-border pt-5 text-xs">© Sportstalent.dk · CVR 33685815</div>
      </div>
    </footer>
  );
}