import { SeoArticleShell } from "@/components/seo/SeoArticleShell";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Poomsae — komplet guide til teknik, træning og bedømmelse",
  description:
    "Alt om poomsae i taekwondo: rækkefølge, bedømmelseskriterier, træningsstruktur og drills til præcision, kraft og balance.",
  author: { "@type": "Organization", name: "Sportstalent" },
  publisher: { "@type": "Organization", name: "Sportstalent" },
  mainEntityOfPage: "https://sportstalent.dk/poomsae",
  inLanguage: "da",
};

export default function Poomsae() {
  return (
    <SeoArticleShell
      title="Poomsae — guide til teknik, træning og stævne"
      description="Poomsae-guide til taekwondo: bedømmelseskriterier, ugentlig træningsstruktur, drills til balance og præcision, og et 8-ugers program frem mod stævne."
      canonical="https://sportstalent.dk/poomsae"
      breadcrumbLabel="Poomsae"
      h1="Poomsae — teknik, træning og stævneforberedelse"
      jsonLd={jsonLd}
      intro={
        <>
          Poomsae er taekwondos kunstform: en fastlagt serie af blokeringer, spark og stillinger, der bedømmes på <strong>præcision, kraft, balance og udtryk</strong>. Denne guide viser dig, hvordan du strukturerer træningen og bygger et program frem mod stævnedagen.
        </>
      }
      related={[
        { to: "/taekwondo-traeningsprogram", title: "Taekwondo træningsprogram", desc: "Periodiseret ugeplan med styrke, hastighed og teknik." },
        { to: "/taekwondo-teknik", title: "Taekwondo teknik", desc: "Drills til spark, footwork og præcision." },
        { to: "/staevneforberedelse-taekwondo", title: "Stævneforberedelse", desc: "6-ugers peak-plan til stævne." },
      ]}
    >
      <h2>Bedømmelseskriterier — hvad giver point i poomsae?</h2>
      <p>
        WT (World Taekwondo) bedømmer poomsae på to hovedkategorier: <strong>accuracy</strong> (teknisk præcision) og <strong>presentation</strong> (fremførelse). Forstår du de underliggende parametre, ved du præcis hvad du skal træne.
      </p>
      <ul>
        <li><strong>Accuracy:</strong> basisteknik, stillingsdybde, rækkefølge.</li>
        <li><strong>Speed & power:</strong> tempo, kraftudtryk, rytme.</li>
        <li><strong>Balance:</strong> stabilitet i stillinger, landing på spark.</li>
        <li><strong>Expression:</strong> energi, indlevelse, kihap.</li>
      </ul>

      <h2>Ugentlig træningsstruktur for poomsae-atleter</h2>
      <h3>Mandag — Teknisk grundtræning</h3>
      <ul>
        <li>Basis: stillinger 15 min (ap kubi, dwit kubi, beom seogi)</li>
        <li>Fuld poomsae 5× med fokus på præcision (ikke tempo)</li>
      </ul>
      <h3>Tirsdag — Styrke og balance</h3>
      <ul>
        <li>Split squat 3×8/ben (dybe stillinger)</li>
        <li>Enkeltbens-balance med spark-hold 3×30 sek/ben</li>
        <li>Copenhagen plank 3×20 sek (lyske-stabilitet)</li>
      </ul>
      <h3>Onsdag — Sparketeknik og eksplosivitet</h3>
      <ul>
        <li>Naeryo chagi og twio dwi huryeo — 4×5/side</li>
        <li>Box jump 4×3 (landings-kontrol)</li>
      </ul>
      <h3>Torsdag — Rytme og tempo</h3>
      <ul>
        <li>Poomsae på 3 tempi: 70% / 85% / 100%</li>
        <li>Video-feedback på timing</li>
      </ul>
      <h3>Fredag — Sektionsarbejde</h3>
      <ul>
        <li>Del poomsae i 3 sektioner — perfekter hver for sig</li>
      </ul>
      <h3>Lørdag — Fremførelse under pres</h3>
      <ul>
        <li>Mock-bedømmelse: dommer + kamera</li>
        <li>Kihap-drills, blik og "presence"</li>
      </ul>

      <h2>De 6 vigtigste drills til poomsae</h2>
      <ol>
        <li><strong>Slow-motion runs:</strong> hele poomsae på halvt tempo — afslører balancefejl.</li>
        <li><strong>Stillingsholds:</strong> 30 sek statisk i ap kubi og dwit kubi.</li>
        <li><strong>Landings-drill:</strong> spark → hold landing i 3 sek uden vaklen.</li>
        <li><strong>Kihap-timing:</strong> synkroniser kihap med kraftmomentet.</li>
        <li><strong>Blik og fokus:</strong> hoved før krop — vend først blikket, så bevægelsen.</li>
        <li><strong>Video-review:</strong> optag hver session, sammenlign uge for uge.</li>
      </ol>

      <h2>8-ugers program frem mod poomsae-stævne</h2>
      <ul>
        <li><strong>Uge 1–3 (Base):</strong> teknik-detaljer, styrke, mobility.</li>
        <li><strong>Uge 4–6 (Udvikling):</strong> tempo op, mock-bedømmelser, sektionsarbejde.</li>
        <li><strong>Uge 7 (Peak):</strong> fuld gennemførsel dagligt, taper i styrke.</li>
        <li><strong>Uge 8 (Stævne):</strong> let teknik, mental træning, søvn ≥ 8 timer.</li>
      </ul>

      <p>
        Bygger du poomsae-programmet i Sportstalent, får du automatisk periodisering, video-log og drill-bibliotek. <a href="/programs">Se program-typerne</a> eller <a href="/methodology">læs metoden bag</a>.
      </p>
    </SeoArticleShell>
  );
}
