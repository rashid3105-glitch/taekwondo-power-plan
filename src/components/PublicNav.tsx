import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";

const navLinks = [
  { labelKey: "navAbout" as const, path: "/about" },
  { labelKey: "navPrograms" as const, path: "/programs" },
  { labelKey: "navMethodology" as const, path: "/methodology" },
  { labelKey: "viewPricing" as const, path: "/pricing" },
  { labelKey: "navContact" as const, path: "/contact" },
  { labelKey: "help" as const, path: "/help" },
];

export function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src={logo} alt="Sportstalent" className="h-8 w-8 rounded-lg object-contain flex-shrink-0" />
          <span className="text-sm font-extrabold tracking-tight text-foreground whitespace-nowrap hidden sm:inline">
            SPORTSTALENT
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                location.pathname === link.path
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {t(link.labelKey)}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-block" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/auth")}
            className="text-xs font-semibold hidden sm:inline-flex"
          >
            {t("signIn")}
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-1 animate-in slide-in-from-top-2 fade-in-0 duration-200">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMobileOpen(false); }}
              className={cn(
                "flex w-full items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                location.pathname === link.path
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {t(link.labelKey)}
            </button>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => { navigate("/auth"); setMobileOpen(false); }}
              className="text-xs font-semibold flex-1"
            >
              {t("signIn")}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
