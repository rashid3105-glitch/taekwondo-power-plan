import { useNavigate, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";

const GOLD = "#F5C842";
const NAV_LINKS = [
  { label: "Platform", href: "/platform" },
  { label: "Funktioner", href: "/funktioner" },
  { label: "Priser", href: "/priser" },
  { label: "Om os", href: "/about" },
  { label: "Blog", href: "/blog" },
];

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{ background: "#0B0C14", color: "#fff", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      <nav style={{ background: "rgba(11,12,20,0.97)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Row 1: logo + utility */}
        <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo height={40} onClick={() => navigate("/")} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LanguageSwitcher />
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `0.5px solid ${GOLD}`,
                background: GOLD,
                color: "#0B0C14",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Log ind
            </button>
          </div>
        </div>
        {/* Row 2: nav links */}
        <div
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            padding: "8px 16px",
            borderTop: "0.5px solid rgba(255,255,255,0.05)",
            overflowX: "auto",
          }}
        >
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.href;
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
                }}
              >
                {l.label}
              </span>
            );
          })}
        </div>
      </nav>
      <main>{children}</main>
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em" }}>Sports<span style={{ color: GOLD }}>talent</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>CVR 33685815 · København, Danmark</div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {[
              { label: "Privatlivspolitik", href: "/privacy" },
              { label: "Vilkår", href: "/terms" },
              { label: "Kontakt", href: "/priser" },
              { label: "Blog", href: "/blog" },
            ].map(l => <span key={l.href} onClick={() => navigate(l.href)} style={{ cursor: "pointer" }}>{l.label}</span>)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>© 2026 Sportstalent.dk</div>
        </div>
      </footer>
    </div>
  );
}
