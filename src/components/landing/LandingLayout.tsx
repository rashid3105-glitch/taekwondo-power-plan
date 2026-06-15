import { useNavigate, useLocation } from "react-router-dom";

const GOLD = "#F5C842";
const NAV_LINKS = [
  { label: "Platform", href: "/platform" },
  { label: "Funktioner", href: "/funktioner" },
  { label: "Priser", href: "/priser" },
  { label: "Om os", href: "/about" },
];

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{ background: "#0B0C14", color: "#fff", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      <nav style={{ background: "rgba(11,12,20,0.97)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div onClick={() => navigate("/")} style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", cursor: "pointer" }}>
          Sports<span style={{ color: GOLD }}>talent</span>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 14 }}>
          {NAV_LINKS.map(l => (
            <span key={l.href} onClick={() => navigate(l.href)} style={{ color: location.pathname === l.href ? GOLD : "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: location.pathname === l.href ? 600 : 400 }}>{l.label}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/auth")} style={{ padding: "8px 18px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", background: "transparent", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Log ind</button>
          <button onClick={() => navigate("/auth")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: GOLD, color: "#0B0C14", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Prøv gratis</button>
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
