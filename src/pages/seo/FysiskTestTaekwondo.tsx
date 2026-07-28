import { SeoArticleShell } from "@/components/seo/SeoArticleShell";

const canonical = "https://sportstalent.dk/fysiske-test";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Fysiske tests i taekwondo — protokoller og benchmarks",
  description:
    "Standardiserede testprotokoller for taekwondo: 10 m sprint, vertikalt hop, agility og sparkfrekvens — med benchmarks og retningslinjer for gentestning.",
  inLanguage: "da",
  mainEntityOfPage: canonical,
  author: { "@type": "Organization", name: "Sportstalent", url: "https://sportstalent.dk" },
  publisher: { "@type": "Organization", name: "Sportstalent", url: "https://sportstalent.dk" },
};

export default function FysiskTestTaekwondo() {
  return (
    <SeoArticleShell
      title="Fysisk test i taekwondo — protokoller og benchmarks"
      description="Sådan tester du sprint, spring, agility og sparkfrekvens i taekwondo. Standardiserede protokoller, benchmarks og hvornår du skal gentage testene."
      canonical={canonical}
      breadcrumbLabel="Fysiske tests"
      h1="Fysisk test i taekwondo: protokoller, benchmarks og opfølgning"
      intro={
        <p>
          Uden målinger er træningsstyring gætværk. Her er de testprotokoller vi bruger til at
          vurdere eksplosivitet, hastighed, retningsskift og sparkfrekvens hos taekwondo-atleter —
          samt hvordan du fortolker tallene og planlægger gentestning.
        </p>
      }
      jsonLd={jsonLd}
      related={[
        { to: "/traeningsprogram", title: "Træningsprogram", desc: "Periodiseret program tilpasset klubtræningen." },
        { to: "/tekniktraening", title: "Teknik og kvalitet", desc: "Sådan kobles teknisk arbejde til fysisk kapacitet." },
        { to: "/staevneforberedelse", title: "Stævneforberedelse", desc: "Peaking og nedtrapning frem mod konkurrence." },
        { to: "/platform/coach-dashboard", title: "Trænerens overblik", desc: "Registrér tests og følg udviklingen for hele holdet." },
      ]}

    >
      <h2>Hvorfor teste?</h2>
      <p>
        En testbatteri giver tre ting: et udgangspunkt, en måde at se om træningen virker, og
        objektive kriterier når atleten skal skifte fase. Vælg få tests, gennemfør dem ens hver
        gang, og gentag dem 3–4 gange om året.
      </p>

      <h2>Testrækkefølge på testdagen</h2>
      <p>
        Rækkefølgen betyder noget: neurale, ikke-trættende tests først, kredsløbstest sidst.
      </p>
      <ol>
        <li>Standardiseret opvarmning (10–12 min, samme hver gang)</li>
        <li>Vertikalt hop (CMJ)</li>
        <li>10 m og 20 m sprint</li>
        <li>Agility / retningsskift</li>
        <li>Sparkfrekvens (10 sek. og 30 sek.)</li>
        <li>Bevægelighed og stabilitet</li>
        <li>Kredsløb (Yo-Yo IR1 eller 20 m beep-test)</li>
      </ol>

      <h2>1. Vertikalt hop (CMJ)</h2>
      <p>
        Måler eksplosiv benkraft — direkte relateret til spark- og fremdriftskraft. Hænder i
        hoften, hurtig nedbøjning, maksimalt hop. 3 forsøg, 45 sek. pause, bedste tæller.
      </p>
      <ul>
        <li>Ungdom (13–15 år): 28–38 cm</li>
        <li>Junior/senior kvinder: 32–42 cm</li>
        <li>Junior/senior mænd: 40–55 cm</li>
      </ul>

      <h2>2. 10 m og 20 m sprint</h2>
      <p>
        10 m fanger acceleration — det mest relevante for indgange i kamp. Stående start 30 cm bag
        startlinjen, elektroniske porte hvis muligt, ellers samme tidtager hver gang. 3 forsøg med
        2–3 min pause.
      </p>
      <ul>
        <li>10 m, senior mænd: 1,70–1,85 sek.</li>
        <li>10 m, senior kvinder: 1,85–2,00 sek.</li>
        <li>Forbedring på 0,05 sek. er reel — mindre end det er måleusikkerhed.</li>
      </ul>

      <h2>3. Agility og retningsskift</h2>
      <p>
        Brug en 5-0-5-test: 10 m tilløb, vendning på markering, 5 m tilbage. Mål kun de sidste 5 m
        ind og 5 m ud. Test begge ben — en forskel på over 5 % mellem sider er et rødt flag for
        både præstation og skadesrisiko.
      </p>

      <h2>4. Sparkfrekvens</h2>
      <p>
        Taekwondo-specifik kapacitet: antal godkendte bandal chagi på pude på 10 sekunder
        (alaktisk kraft) og på 30 sekunder (laktisk udholdenhed). Fast pudehøjde og fast afstand.
        Fald i frekvens fra første til sidste 10 sek. af 30-sekunderstesten viser
        udtrætningsprofilen.
      </p>
      <ul>
        <li>10 sek.: 18–24 spark for konkurrenceatleter</li>
        <li>30 sek.: fald under 20 % fra første til sidste tredjedel</li>
      </ul>

      <h2>5. Bevægelighed og stabilitet</h2>
      <p>
        Aktiv hoftefleksion, sideliggende abduktion og enkeltbens-balance. Bevægelighed er en
        forudsætning for højde og teknik — ikke en separat disciplin.
      </p>

      <h2>6. Kredsløb</h2>
      <p>
        Yo-Yo Intermittent Recovery Level 1 matcher kampens intervalprofil bedre end en konstant
        løbetest. Notér niveau og samlet distance.
      </p>

      <h2>Hvor ofte skal der testes?</h2>
      <ul>
        <li><strong>Sæsonstart:</strong> fuld testbatteri som udgangspunkt</li>
        <li><strong>Midt i forberedelsesfasen:</strong> CMJ + 10 m sprint (korte tests)</li>
        <li><strong>4–6 uger før hovedstævne:</strong> fuld batteri igen</li>
        <li><strong>Efter sæson:</strong> fuld batteri for at vurdere årets udvikling</li>
      </ul>

      <h2>Sådan bruger du tallene</h2>
      <p>
        Sammenlign atleten med sig selv, ikke med holdet. Stagnation i CMJ mens sprinttiden falder
        betyder ofte, at træningen har flyttet sig mod hastighed frem for kraft — juster
        fasevægtningen frem for at tilføje mere volumen. I Sportstalent registreres alle tests pr.
        atlet, så udviklingen over sæsonen kan ses i én graf og bruges til at styre næste fase.
      </p>
    </SeoArticleShell>
  );
}
