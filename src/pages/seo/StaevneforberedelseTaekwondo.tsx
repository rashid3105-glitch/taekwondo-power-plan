import { SeoArticleShell } from "@/components/seo/SeoArticleShell";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Stævneforberedelse taekwondo — 6-ugers peak-plan",
  description:
    "Komplet 6-ugers stævneforberedelse i taekwondo: periodisering, taper, vægtstyring, mental træning og drills til stævnedagen.",
  author: { "@type": "Organization", name: "Sportstalent" },
  publisher: { "@type": "Organization", name: "Sportstalent" },
  mainEntityOfPage: "https://sportstalent.dk/staevneforberedelse-taekwondo",
  inLanguage: "da",
};

export default function StaevneforberedelseTaekwondo() {
  return (
    <SeoArticleShell
      title="Stævneforberedelse taekwondo — 6-ugers peak-plan"
      description="Komplet guide til stævneforberedelse i taekwondo: 6-ugers peak-plan, taper, vægtstyring, mental træning, sparringsdrills og tjekliste til stævnedagen."
      canonical="https://sportstalent.dk/staevneforberedelse-taekwondo"
      breadcrumbLabel="Stævneforberedelse"
      h1="Stævneforberedelse i taekwondo — 6-ugers peak-plan"
      jsonLd={jsonLd}
      intro={
        <>
          Stævneforberedelse er ikke "træn hårdere". Det er <strong>periodisering, taper, teknisk skarphed og mental parathed</strong> — timet så du toppes præcis på stævnedagen. Her er 6-ugers planen.
        </>
      }
      related={[
        { to: "/taekwondo-traeningsprogram", title: "Taekwondo træningsprogram", desc: "Årsplanen som fører til stævne-peak." },
        { to: "/taekwondo-teknik", title: "Taekwondo teknik", desc: "Drills der virker i sparring." },
        { to: "/poomsae", title: "Poomsae", desc: "Peak-plan for formløb-stævner." },
      ]}
    >
      <h2>Principperne bag et vellykket peak</h2>
      <ul>
        <li><strong>Volumen ned, intensitet op</strong> — mindre tid i træning, højere kvalitet.</li>
        <li><strong>Specificitet</strong> — det du gør de sidste 3 uger skal ligne stævnet.</li>
        <li><strong>Restitution som prioritet</strong> — søvn, mad og mental ro afgør dagen.</li>
      </ul>

      <h2>Uge-for-uge plan (6 uger til stævne)</h2>

      <h3>Uge 6 — Fysisk grundlag</h3>
      <ul>
        <li>Styrke: 3× ugen, tunge løft (5×5 @ 80–85%)</li>
        <li>Taekwondo: 3× klub, teknisk fokus</li>
        <li>Sparring: 1× ugen, situationssparring</li>
        <li>Volumen: 100%</li>
      </ul>

      <h3>Uge 5 — Kraft-hastighed</h3>
      <ul>
        <li>Styrke: skift til power (3×3 @ 70% + hurtig excentrik)</li>
        <li>Plyometrics: box jumps, broad jumps 2× ugen</li>
        <li>Sparring: 2× ugen, 3×2 min runder</li>
        <li>Volumen: 90%</li>
      </ul>

      <h3>Uge 4 — Specifik forberedelse</h3>
      <ul>
        <li>Kombinationer på tempo (bandal → dollyo → naeryo)</li>
        <li>Reaktions-drills med cue</li>
        <li>Sparring: 3× ugen, matcher-mod-matcher-format</li>
        <li>Volumen: 85%</li>
      </ul>

      <h3>Uge 3 — Score-scenarier</h3>
      <ul>
        <li>Sparring: "sidste 30 sek foran/bagud" scenarier</li>
        <li>Vægtstyring begynder — kontrol, ikke chok</li>
        <li>Video-analyse af egen sparring</li>
        <li>Volumen: 75%</li>
      </ul>

      <h3>Uge 2 — Taper begynder</h3>
      <ul>
        <li>Styrke: kort og let (2×3 @ 60%, snap-fart)</li>
        <li>Sparring: 2× ugen, 3×1 min højintensitet</li>
        <li>Ekstra søvn: +30 min pr. nat</li>
        <li>Volumen: 60%</li>
      </ul>

      <h3>Uge 1 — Peak-uge</h3>
      <ul>
        <li>Man: let teknik 30 min</li>
        <li>Tir: kort skarp sparring 3×1 min</li>
        <li>Ons: mobility + visualisering</li>
        <li>Tor: teknisk gennemløb 20 min</li>
        <li>Fre: rejse, let bevægelse, mental prep</li>
        <li>Lør: <strong>STÆVNE</strong></li>
      </ul>

      <h2>Vægtstyring uden performance-tab</h2>
      <p>
        Skal du gå ned i vægt, så gør det gradvist over 3–4 uger. <strong>Aldrig mere end 3% kropsvægt sidste uge.</strong> Sidste 48 timer: reducer natrium og fibre, drik som normalt, undgå ekstreme metoder.
      </p>

      <h2>Mental træning — de sidste 2 uger</h2>
      <ul>
        <li><strong>Visualisering:</strong> 5 min dagligt — kør dine bedste kampe i hovedet.</li>
        <li><strong>Rutiner:</strong> byg fast pre-match rutine (musik, opvarmning, mantra).</li>
        <li><strong>Åndedræt:</strong> boxbreathing 4-4-4-4 mellem kampe.</li>
      </ul>

      <h2>Tjekliste — stævnedagen</h2>
      <ul>
        <li>Ankomst 90 min før første kamp</li>
        <li>Opvarmning: 15 min let cardio + 10 min sparketeknik + 5 min hoveddrill</li>
        <li>Mellem kampe: gå, hydrer, visualiser næste modstander</li>
        <li>Efter stævne: 20 min let cardio + protein indenfor 60 min</li>
      </ul>

      <h2>De 4 største fejl før stævne</h2>
      <ol>
        <li><strong>Ny teknik i sidste uge</strong> — kroppen har ikke tid til at automatisere.</li>
        <li><strong>For hård sparring uge 1</strong> — små skader og tømt nervesystem.</li>
        <li><strong>Panik-vægttab</strong> — ødelægger reaktion og udholdenhed.</li>
        <li><strong>For lidt søvn rejsedag</strong> — planlæg, som var det en del af træningen.</li>
      </ol>

      <p>
        Sportstalent bygger automatisk peak-planen ind i din sæsonkalender, med taper, teknik-fokus og mental træning. <a href="/for-traenere">Se trænerværktøjerne</a> eller <a href="/programs">bygge dit program</a>.
      </p>
    </SeoArticleShell>
  );
}
