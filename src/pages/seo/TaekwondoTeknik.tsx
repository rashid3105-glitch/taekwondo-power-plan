import { SeoArticleShell } from "@/components/seo/SeoArticleShell";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Taekwondo teknik — spark, footwork og præcision",
  description:
    "Detaljeret guide til taekwondo-teknik: bandal chagi, dollyo, footwork, timing og de drills, der faktisk forbedrer teknikken.",
  author: { "@type": "Organization", name: "Sportstalent" },
  publisher: { "@type": "Organization", name: "Sportstalent" },
  mainEntityOfPage: "https://sportstalent.dk/taekwondo-teknik",
  inLanguage: "da",
};

export default function TaekwondoTeknik() {
  return (
    <SeoArticleShell
      title="Taekwondo teknik — komplet guide til spark og footwork"
      description="Sådan forbedrer du taekwondo-teknik: udførelse af bandal chagi, dollyo og naeryo, footwork-mønstre, timing-drills og de mest effektive øvelser til hver teknik."
      canonical="https://sportstalent.dk/taekwondo-teknik"
      breadcrumbLabel="Taekwondo teknik"
      h1="Taekwondo teknik — sådan bygger du præcise spark og skarp footwork"
      jsonLd={jsonLd}
      intro={
        <>
          Teknik i taekwondo handler ikke om at spark højere — det handler om <strong>præcision, timing og hoftedrejning</strong>. Denne guide gennemgår de vigtigste spark, footwork-mønstre og drills, der faktisk overføres til sparring.
        </>
      }
      related={[
        { to: "/taekwondo-traeningsprogram", title: "Taekwondo træningsprogram", desc: "Periodiseret ugeplan med teknik indbygget." },
        { to: "/poomsae", title: "Poomsae", desc: "Teknisk mesterskab gennem formløb." },
        { to: "/staevneforberedelse-taekwondo", title: "Stævneforberedelse", desc: "Peak-plan til stævnedagen." },
      ]}
    >
      <h2>De 5 spark hver taekwondo-atlet skal mestre</h2>
      <h3>1. Bandal chagi (roundhouse — hurtig scorer)</h3>
      <p>
        Nøglen er <strong>hoftedrejning før kontakt</strong>. Standben roterer 90°, knæet føres først op og ud, foden slår som en pisk.
      </p>
      <p><strong>Drill:</strong> 3×10 bandal chagi mod pad med fokus på "knee up first" — spark ikke før knæet er højt.</p>

      <h3>2. Dollyo chagi (kraftfuld roundhouse)</h3>
      <p>
        Længere pisk, mere hofte. Bruges til at bryde afstand og score på krop.
      </p>
      <p><strong>Drill:</strong> Slow-motion 3×5 pr. side foran spejl — fanger fejl i hoften.</p>

      <h3>3. Naeryo chagi (axe kick — hovedscorer)</h3>
      <p>Knæ højt, ben strakt ned oppefra. Kræver hamstring-fleksibilitet.</p>
      <p><strong>Drill:</strong> Assisted straight-leg raises 3×10 dagligt + naeryo på pad 3×8/side.</p>

      <h3>4. Twio dwi huryeo chagi (jumping back hook)</h3>
      <p>Højeste point-værdi men mest teknisk krævende. Kræver eksplosiv hoftedrejning i luften.</p>
      <p><strong>Drill:</strong> Break down i 3 faser — jump, drej, spark — og træn hver del isoleret 3×5.</p>

      <h3>5. Yop chagi (side kick — kontrol og afstand)</h3>
      <p>Undervurderet stopper — bruges til at holde modstanderen ude.</p>

      <h2>Footwork — det, der adskiller niveauer</h2>
      <p>
        90% af taekwondo-teknik afgøres af, om foden står rigtigt. De fire grundmønstre:
      </p>
      <ul>
        <li><strong>Step-in:</strong> back foot skubber, front foot glider — bevar tyngdepunkt.</li>
        <li><strong>Step-back:</strong> spejlvendt — brug til at trække modstander frem.</li>
        <li><strong>Switch step:</strong> skifte af sikring, hurtigt sparkskifte.</li>
        <li><strong>Side step:</strong> ud af linje — åbner scoringsvinkel.</li>
      </ul>
      <p><strong>Footwork-drill (10 min dagligt):</strong> 30 sek. hvert mønster foran spejl, 4 runder.</p>

      <h2>Timing og reaktion</h2>
      <p>Timing kan trænes systematisk. Tre progressioner:</p>
      <ol>
        <li><strong>Cued response:</strong> partner klapper → du sparker (0.5 sek reaktionsvindue).</li>
        <li><strong>Visual cue:</strong> partner løfter hånd → du modspark.</li>
        <li><strong>Full sparring cue:</strong> partner starter angreb → du counter'er.</li>
      </ol>

      <h2>De 3 fejl, der ødelægger teknik</h2>
      <ol>
        <li><strong>Ingen hoftedrejning</strong> — sparket bliver "kick with the leg", ikke "kick with the hip".</li>
        <li><strong>Hænderne falder</strong> — sikring under bæltet under spark. Fix: 30 sek shadow-boxing før hver runde.</li>
        <li><strong>Landing på balancen</strong> — lander ude af balance = 0.5 sek tabt til counter. Fix: landings-hold 3 sek efter hvert spark.</li>
      </ol>

      <h2>Ugentlig teknik-struktur</h2>
      <ul>
        <li><strong>2× ugen:</strong> Isoleret sparketeknik (30 min).</li>
        <li><strong>2× ugen:</strong> Footwork + timing (15 min).</li>
        <li><strong>1× ugen:</strong> Video-review af sparring — spot mønstre.</li>
      </ul>

      <p>
        I <a href="/programs">Sportstalent-programmerne</a> er alle drills lagt ind som video og progression, så du kan følge fremgangen uge for uge. <a href="/methodology">Se metoden bag</a>.
      </p>
    </SeoArticleShell>
  );
}
