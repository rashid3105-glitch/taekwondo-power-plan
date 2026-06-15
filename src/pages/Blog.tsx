import { useNavigate } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";

const GOLD = "#F5C842";

const Blog = () => {
  const navigate = useNavigate();
  return (
    <LandingLayout>
      <PageMeta title="Blog · Sportstalent" description="Artikler om talentudvikling, coaching og sportsvidenskab — kommer snart." />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "120px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", color: GOLD, marginBottom: 24 }}>
          BLOG
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 20 }}>
          Kommer snart!
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 40 }}>
          Vi arbejder på artikler om talentudvikling, coaching og sportsvidenskab.
          Hold øje med denne side — eller skriv dig op for at få besked, når vi går i luften.
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            background: GOLD,
            color: "#0B0C14",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Tilbage til forsiden
        </button>
      </div>
    </LandingLayout>
  );
};

export default Blog;
