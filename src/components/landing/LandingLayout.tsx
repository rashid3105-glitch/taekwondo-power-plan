import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Home, LayoutGrid, Sparkles, CreditCard, Info, Newspaper } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#F5C842";


const useWidth = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  return w;
};

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const w = useWidth();
  const isMobile = w < 720;
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: t("navHome"), href: "/", icon: Home, ariaLabel: t("navHome") },
    { label: t("navPlatform"), href: "/platform", icon: LayoutGrid, ariaLabel: t("navPlatform") },
    { label: t("navFeatures"), href: "/funktioner", icon: Sparkles, ariaLabel: t("navFeatures") },
    { label: t("navPricing"), href: "/priser", icon: CreditCard, ariaLabel: t("navPricing") },
    { label: t("navAbout"), href: "/about", icon: Info, ariaLabel: t("navAbout") },
    { label: t("navBlog"), href: "/blog", icon: Newspaper, ariaLabel: t("navBlog") },
  ];


  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname === href || location.pathname.startsWith(href + "/");

  // Body scroll lock + Escape to close
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Close overlay on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const go = (href: string) => {
    setMenuOpen(false);
    navigate(href);
  };

  return (
    <div style={{ background: "#0B0C14", color: "#fff", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      <nav style={{ background: "rgba(11,12,20,0.97)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Row 1: logo + utility */}
        <div style={{ padding: "0 16px", height: isMobile ? 48 : 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo height={isMobile ? 30 : 40} onClick={() => navigate("/")} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LanguageSwitcher compact={isMobile} />
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: isMobile ? "6px 12px" : "8px 16px",
                borderRadius: 8,
                border: isMobile ? `0.5px solid rgba(245,200,66,0.5)` : "none",
                background: isMobile ? "transparent" : GOLD,
                color: isMobile ? GOLD : "#0B0C14",
                fontSize: isMobile ? 11 : 13,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t("signIn")}
            </button>
            {isMobile && (
              <button
                aria-label={menuOpen ? "Luk menu" : "Åbn menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "0.5px solid rgba(245,200,66,0.4)",
                  borderRadius: 8,
                  color: GOLD,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
        {/* Row 2: nav links (desktop only) */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              padding: "8px 12px",
              borderTop: "0.5px solid rgba(255,255,255,0.05)",
              overflowX: "auto",
            }}
          >
            {NAV_LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <span
                  key={l.href}
                  onClick={() => navigate(l.href)}
                  style={{
                    color: active ? GOLD : "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    fontWeight: active ? 700 : 500,
                    fontSize: 12,
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: active ? `1px solid ${GOLD}` : "1px solid transparent",
                    background: active ? "rgba(245,200,66,0.08)" : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  {l.label}
                </span>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile overlay menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 48,
            left: 0,
            right: 0,
            height: "calc(100vh - 48px)",
            background: "linear-gradient(180deg, #0B0C14 0%, #10121c 100%)",
            backdropFilter: "blur(8px)",
            zIndex: 99,
            display: "flex",
            flexDirection: "column",
            padding: "16px 0 24px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              padding: "16px 16px 8px",
              flex: 1,
              alignContent: "start",
            }}
          >
            {NAV_LINKS.map((l) => {
              const active = isActive(l.href);
              const Icon = l.icon;
              return (
                <button
                  key={l.href}
                  onClick={() => go(l.href)}
                  aria-label={l.ariaLabel}
                  title={l.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: active ? "rgba(245,200,66,0.1)" : "rgba(255,255,255,0.03)",
                    border: active ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                    color: active ? GOLD : "rgba(255,255,255,0.85)",
                    borderRadius: 12,
                    padding: "18px 8px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    minHeight: 88,
                  }}
                >
                  <Icon size={26} strokeWidth={1.8} />
                  <span
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: "hidden",
                      clip: "rect(0, 0, 0, 0)",
                      whiteSpace: "nowrap",
                      border: 0,
                    }}
                  >
                    {l.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ padding: "0 16px" }}>
            <button
              onClick={() => go("/auth")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background: GOLD,
                color: "#0B0C14",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {t("signIn")}
            </button>
          </div>
        </div>
      )}

      <main>{children}</main>
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <BrandLogo height={36} onClick={() => navigate("/")} />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>CVR 33685815 · København, Danmark</div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {[
              { label: t("homeFooterPrivacy"), href: "/privacy" },
              { label: t("homeFooterTerms"), href: "/terms" },
              { label: t("homeFooterContact"), href: "/priser" },
              { label: t("navBlog"), href: "/blog" },
            ].map(l => <span key={l.href} onClick={() => navigate(l.href)} style={{ cursor: "pointer" }}>{l.label}</span>)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>© 2026 Sportstalent.dk</div>
        </div>
      </footer>
    </div>
  );
}
