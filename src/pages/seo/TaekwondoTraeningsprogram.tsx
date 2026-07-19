import { SeoArticleShell } from "@/components/seo/SeoArticleShell";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Taekwondo træningsprogram — periodiseret plan med eksempler",
  description:
    "Et komplet, periodiseret taekwondo-træningsprogram med ugeeksempler til styrke, hastighed, teknik og restitution — bygget efter sportsvidenskab.",
  author: { "@type": "Organization", name: "Sportstalent" },
  publisher: { "@type": "Organization", name: "Sportstalent" },
  mainEntityOfPage: "https://sportstalent.dk/taekwondo-traeningsprogram",
  inLanguage: "da",
};

export default function TaekwondoTraeningsprogram() {
  return (
    <SeoArticleShell
      title="Taekwondo træningsprogram — komplet eksempel og skabelon"
      description="Se et periodiseret taekwondo-træningsprogram med uge-, måneds- og sæsonstruktur. Eksempler på styrke, hastighed, sparring og restitution — klar til brug."
      canonical="https://sportstalent.dk/taekwondo-traeningsprogram"
      breadcrumbLabel="Taekwondo træningsprogram"
      h1="Taekwondo træningsprogram — struktur, eksempler og skabelon"
      jsonLd={jsonLd}
      intro={
        <>
          Et effektivt taekwondo-træningsprogram balancerer <strong>klubtræning, styrke, hastighed og restitution</strong> hen over ugen. Her får du en færdig ugeplan, periodiseringen bag og de fejl, der bremser de fleste udøvere.
        </>
      }
      related={[
        { to: "/poomsae", title: "Poomsae træning", desc: "Struktur, principper og drills til teknisk mesterskab." },
        { to: "/taekwondo-teknik", title: "Taekwondo teknik", desc: "Præcise drills til spark, footwork og balance." },
        { to: "/staevneforberedelse-taekwondo", title: "Stævneforberedelse", desc: "6-ugers peak-plan frem mod stævnedagen." },
      ]}
    >
      <h2>Sådan er et periodiseret taekwondo-program bygget op</h2>
      <p>
        Et sportsvidenskabeligt program bygges i tre lag: <strong>makro</strong> (sæsonen), <strong>meso</strong> (4–6 ugers blokke) og <strong>mikro</strong> (ugen). Hver blok har ét primært mål — fx generel styrke, eksplosivitet eller stævne-peak — og træningen omkring det tilpasses.
      </p>
      <ul>
        <li><strong>Base (4–6 uger):</strong> volumen, teknik, generel styrke.</li>
        <li><strong>Udvikling (4–6 uger):</strong> hastighed, eksplosivitet, sparring-kondition.</li>
        <li><strong>Peak (2–3 uger):</strong> intensitet op, volumen ned, taktik.</li>
        <li><strong>Restitution (1–2 uger):</strong> mobility, teknik, mental reset.</li>
      </ul>

      <h2>Ugeplan — eksempel for en klubtræner-atlet</h2>
      <p>Baseret på 3 klubtræninger + 2–3 supplerende sessioner. Tilpas efter dit niveau.</p>
      <h3>Mandag — Underkrop og mobility</h3>
      <ul>
        <li>Squat 4×5 @ 75–80% 1RM</li>
        <li>Bulgarian split squat 3×8/ben</li>
        <li>Nordic hamstring 3×6 (skadeforebyggelse)</li>
        <li>10 min hoftemobility + 90/90</li>
      </ul>
      <h3>Tirsdag — Taekwondo teknik</h3>
      <ul>
        <li>Warm-up: footwork drills 10 min</li>
        <li>Sparketeknik: bandal chagi, dollyo, naeryo — 4×10/side</li>
        <li>Pad-work på tempo (RPE 7)</li>
      </ul>
      <h3>Onsdag — Eksplosivitet og core</h3>
      <ul>
        <li>Trap-bar deadlift 3×3 @ 80%</li>
        <li>Broad jump 4×3</li>
        <li>Medicine ball rotation throw 4×5/side</li>
        <li>Hollow hold + Pallof press superset</li>
      </ul>
      <h3>Torsdag — Sparring og reaktion</h3>
      <ul>
        <li>Reaktionsdrills: partner-cue → kombination</li>
        <li>3×2 min sparring + 1 min pause</li>
      </ul>
      <h3>Fredag — Overkrop og skadeforebyggelse</h3>
      <ul>
        <li>Bænkpres 4×6</li>
        <li>Pull-ups 4×AMRAP</li>
        <li>Ekstern rotation + Y-T-W 3×12</li>
      </ul>
      <h3>Lørdag — Teknisk sparring / poomsae</h3>
      <ul>
        <li>Fuld poomsae 3× med video-feedback, eller</li>
        <li>Situationssparring: score-scenarier</li>
      </ul>
      <h3>Søndag — Aktiv restitution</h3>
      <ul>
        <li>30–45 min let cardio, mobility, søvn ≥ 8 timer</li>
      </ul>

      <h2>De 5 mest almindelige fejl i taekwondo-programmer</h2>
      <ol>
        <li><strong>Ingen periodisering</strong> — samme intensitet hele året giver plateau.</li>
        <li><strong>For lidt underkropsstyrke</strong> — spark-hastighed kommer fra hoften, ikke fra benet.</li>
        <li><strong>Manglende skadeforebyggelse</strong> — hamstrings, ankler og lyske skal have dedikeret arbejde.</li>
        <li><strong>For meget sparring i base-fasen</strong> — brænder nervesystemet af før stævnesæsonen.</li>
        <li><strong>Ingen deload-uger</strong> — hver 4.–5. uge skal have 40–50% mindre volumen.</li>
      </ol>

      <h2>Sådan bruger du Sportstalent til at automatisere programmet</h2>
      <p>
        Sportstalent bygger dit periodiserede program automatisk baseret på din klubtræning, dit niveau og dine stævnedatoer. Du får ugeplan, sparketeknik-drills, tests og fremgangsgrafer samlet ét sted. <a href="/methodology">Læs mere om metoden bag</a> eller <a href="/programs">se programtyperne</a>.
      </p>
    </SeoArticleShell>
  );
}
