import { useNavigate } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";

const GOLD = "#F5C842";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <LandingLayout>
      <PageMeta title="Vilkår og betingelser · Sportstalent" description="Brugsvilkår for Sportstalent-platformen." />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px" }}>
        <div
          style={{
            background: "rgba(245,200,66,0.1)",
            border: "1px solid rgba(245,200,66,0.35)",
            color: GOLD,
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 32,
          }}
        >
          UDKAST — opdateres løbende
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Vilkår og betingelser
        </h1>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 40 }}>
          Sidst opdateret: 15. juni 2026 · Version 0.1 — udkast
        </div>

        <Section title="1. Aftalens omfang">
          Disse vilkår regulerer din brug af Sportstalent-platformen (sportstalent.dk), drevet
          af Sportstalent, CVR 33685815, København, Danmark. Ved at oprette en konto eller bruge
          platformen accepterer du disse vilkår.
        </Section>

        <Section title="2. Brug af platformen">
          Platformen er beregnet til atleter, trænere, klubber og forældre i forbindelse med
          træningsplanlægning, opfølgning og kommunikation. Du må ikke bruge platformen til
          ulovlige formål, dele dine login-oplysninger eller forsøge at omgå sikkerhedsforanstaltninger.
        </Section>

        <Section title="3. Konto og adgang">
          Nye konti og trænerroller godkendes manuelt af vores administrator. Du er ansvarlig for
          at holde dine kontooplysninger fortrolige og for al aktivitet under din konto.
        </Section>

        <Section title="4. Abonnement og betaling">
          Betalte abonnementer faktureres via Stripe. Priser, faktureringsinterval og opsigelsesvilkår
          fremgår af prisplanen. Du kan til enhver tid opsige dit abonnement; adgangen ophører ved
          udgangen af den betalte periode.
        </Section>

        <Section title="5. Indhold og data">
          Du bevarer ejerskab til de data, du uploader. Vi behandler dine personoplysninger i henhold
          til vores{" "}
          <span onClick={() => navigate("/privacy")} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>
            privatlivspolitik
          </span>
          .
        </Section>

        <Section title="6. Ansvarsfraskrivelse">
          Platformen leveres "som den er". Trænings-, ernærings- og rehabiliteringsindhold er
          vejledende og erstatter ikke professionel medicinsk rådgivning. Sportstalent er ikke
          ansvarlig for skader, tab eller konsekvenser som følge af brug af indholdet.
        </Section>

        <Section title="7. Ændringer">
          Vi kan opdatere disse vilkår løbende. Væsentlige ændringer varsles via platformen eller
          e-mail. Fortsat brug efter ændringer betragtes som accept af de opdaterede vilkår.
        </Section>

        <Section title="8. Kontakt">
          Spørgsmål til vilkårene kan sendes via vores{" "}
          <span onClick={() => navigate("/priser")} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>
            kontaktformular
          </span>
          .
        </Section>
      </div>
    </LandingLayout>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</h2>
    <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>{children}</p>
  </div>
);

export default Terms;
