// Daily motivational quotes for athletes. One is chosen per day-of-year so
// the same quote shows for the whole day across sessions/devices.
// Translations live alongside each quote to avoid runtime translation calls.

export type Locale = "en" | "da" | "sv" | "de" | "ar" | "no";

export interface Quote {
  text: Record<Locale, string>;
  author: string;
}

export const QUOTES: Quote[] = [
  {
    author: "Bruce Lee",
    text: {
      en: "I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.",
      da: "Jeg frygter ikke den mand, der har øvet 10.000 spark én gang, men den mand der har øvet ét spark 10.000 gange.",
      sv: "Jag fruktar inte mannen som övat 10 000 sparkar en gång, utan mannen som övat en spark 10 000 gånger.",
      de: "Ich fürchte nicht den Mann, der 10.000 Tritte einmal geübt hat, sondern den Mann, der einen Tritt 10.000 Mal geübt hat.",
      ar: "لا أخشى الرجل الذي تدرب على 10,000 ركلة مرة واحدة، بل أخشى من تدرب على ركلة واحدة 10,000 مرة.",
      no: "Jeg frykter ikke mannen som har øvd 10 000 spark én gang, men mannen som har øvd ett spark 10 000 ganger.",
    },
  },
  {
    author: "Muhammad Ali",
    text: {
      en: "Don't count the days, make the days count.",
      da: "Tæl ikke dagene — få dagene til at tælle.",
      sv: "Räkna inte dagarna — få dagarna att räknas.",
      de: "Zähle nicht die Tage, lass die Tage zählen.",
      ar: "لا تعدّ الأيام، بل اجعل الأيام تُعدّ.",
      no: "Ikke tell dagene — få dagene til å telle.",
    },
  },
  {
    author: "Choi Hong Hi",
    text: {
      en: "The ultimate purpose of Taekwondo is to eliminate fighting by discouraging the stronger's oppression of the weaker.",
      da: "Taekwondos endelige formål er at eliminere kampen ved at modvirke den stærkes undertrykkelse af den svage.",
      sv: "Taekwondons yttersta syfte är att eliminera kamp genom att motverka den starkares förtryck av den svagare.",
      de: "Das oberste Ziel von Taekwondo ist es, den Kampf zu beenden, indem die Unterdrückung des Schwächeren durch den Stärkeren verhindert wird.",
      ar: "الهدف النهائي للتايكوندو هو القضاء على القتال من خلال منع قمع القوي للضعيف.",
      no: "Det endelige formålet med Taekwondo er å eliminere kamp ved å motvirke den sterkes undertrykkelse av den svake.",
    },
  },
  {
    author: "Jigoro Kano",
    text: {
      en: "Maximum efficiency, minimum effort.",
      da: "Maksimal effektivitet, minimal indsats.",
      sv: "Maximal effektivitet, minimal ansträngning.",
      de: "Maximale Effizienz, minimaler Aufwand.",
      ar: "أقصى كفاءة بأقل جهد.",
      no: "Maksimal effektivitet, minimal innsats.",
    },
  },
  {
    author: "Steven Lopez",
    text: {
      en: "Champions are made when nobody is watching.",
      da: "Mestre skabes, når ingen kigger.",
      sv: "Mästare skapas när ingen tittar.",
      de: "Champions werden gemacht, wenn niemand zuschaut.",
      ar: "الأبطال يُصنعون عندما لا يراهم أحد.",
      no: "Mestere skapes når ingen ser på.",
    },
  },
  {
    author: "Sun Tzu",
    text: {
      en: "In the midst of chaos, there is also opportunity.",
      da: "Midt i kaos findes også muligheder.",
      sv: "Mitt i kaoset finns också möjligheter.",
      de: "Mitten im Chaos liegt auch eine Chance.",
      ar: "في خضم الفوضى توجد أيضًا فرصة.",
      no: "Midt i kaoset finnes også muligheter.",
    },
  },
  {
    author: "Hadi Saei",
    text: {
      en: "Discipline is choosing between what you want now and what you want most.",
      da: "Disciplin er at vælge mellem det, du vil have nu, og det, du vil have allermest.",
      sv: "Disciplin är att välja mellan det du vill ha nu och det du vill ha mest.",
      de: "Disziplin bedeutet, zwischen dem zu wählen, was du jetzt willst, und dem, was du am meisten willst.",
      ar: "الانضباط هو الاختيار بين ما تريده الآن وما تريده أكثر.",
      no: "Disiplin er å velge mellom det du vil ha nå og det du vil ha mest.",
    },
  },
  {
    author: "Hwang Kyung-seon",
    text: {
      en: "Strength does not come from physical capacity. It comes from an indomitable will.",
      da: "Styrke kommer ikke fra fysisk kapacitet. Den kommer fra en ukuelig vilje.",
      sv: "Styrka kommer inte från fysisk kapacitet. Den kommer från en obetvinglig vilja.",
      de: "Stärke kommt nicht aus körperlicher Leistungsfähigkeit. Sie kommt aus einem unbezwingbaren Willen.",
      ar: "القوة لا تأتي من القدرة الجسدية، بل من إرادة لا تُقهر.",
      no: "Styrke kommer ikke fra fysisk kapasitet. Den kommer fra en ukuelig vilje.",
    },
  },
  {
    author: "Miyamoto Musashi",
    text: {
      en: "Today is victory over yourself of yesterday.",
      da: "I dag er sejren over gårsdagens udgave af dig selv.",
      sv: "Idag är seger över ditt jag från igår.",
      de: "Heute ist der Sieg über dein Gestern.",
      ar: "اليوم هو النصر على ذاتك من الأمس.",
      no: "I dag er seieren over gårsdagens utgave av deg selv.",
    },
  },
  {
    author: "Servet Tazegül",
    text: {
      en: "The harder the battle, the sweeter the victory.",
      da: "Jo hårdere kamp, desto sødere sejr.",
      sv: "Ju hårdare strid, desto sötare seger.",
      de: "Je härter der Kampf, desto süßer der Sieg.",
      ar: "كلما اشتدت المعركة، كان النصر أحلى.",
      no: "Jo hardere kamp, jo søtere seier.",
    },
  },
  {
    author: "Jade Jones",
    text: {
      en: "Dream big, work hard, stay focused, and surround yourself with good people.",
      da: "Drøm stort, arbejd hårdt, hold fokus, og omgiv dig med gode mennesker.",
      sv: "Dröm stort, arbeta hårt, håll fokus, och omge dig med bra människor.",
      de: "Träume groß, arbeite hart, bleib fokussiert und umgib dich mit guten Menschen.",
      ar: "احلم كبيرًا، اعمل بجد، حافظ على تركيزك، وأحط نفسك بأناس صالحين.",
      no: "Drøm stort, jobb hardt, hold fokus, og omgi deg med gode mennesker.",
    },
  },
  {
    author: "Anonymous",
    text: {
      en: "A black belt is a white belt who never quit.",
      da: "Et sort bælte er et hvidt bælte, der aldrig gav op.",
      sv: "Ett svart bälte är ett vitt bälte som aldrig gav upp.",
      de: "Ein schwarzer Gürtel ist ein weißer Gürtel, der niemals aufgegeben hat.",
      ar: "الحزام الأسود هو حزام أبيض لم يستسلم أبدًا.",
      no: "Et sort belte er et hvitt belte som aldri ga opp.",
    },
  },
  {
    author: "Bruce Lee",
    text: {
      en: "Absorb what is useful, discard what is not, add what is uniquely your own.",
      da: "Opsug det brugbare, kassér det unødvendige, og tilføj det, der er unikt dit eget.",
      sv: "Ta till dig det som är användbart, släng det som inte är det, lägg till det som är unikt ditt.",
      de: "Nimm auf, was nützlich ist, verwirf, was es nicht ist, und füge das hinzu, was einzigartig dein Eigenes ist.",
      ar: "استوعب ما هو مفيد، وتخلَّ عما ليس كذلك، وأضف ما هو فريد من عندك.",
      no: "Ta til deg det som er nyttig, kast det som ikke er det, og legg til det som er unikt ditt.",
    },
  },
  {
    author: "Aristotle",
    text: {
      en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
      da: "Vi er det, vi gentagne gange gør. Fortræffelighed er derfor ikke en handling, men en vane.",
      sv: "Vi är vad vi upprepat gör. Förträfflighet är därför inte en handling, utan en vana.",
      de: "Wir sind, was wir wiederholt tun. Exzellenz ist daher keine Handlung, sondern eine Gewohnheit.",
      ar: "نحن ما نفعله بشكل متكرر. التفوّق إذًا ليس فعلاً، بل عادة.",
      no: "Vi er det vi gjentatte ganger gjør. Fortreffelighet er derfor ikke en handling, men en vane.",
    },
  },
];

export function getDailyQuote(locale: Locale, date = new Date()): { text: string; author: string } {
  // Day-of-year index so the same quote shows all day, regardless of timezone shifts.
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const idx = dayOfYear % QUOTES.length;
  const q = QUOTES[idx];
  return { text: q.text[locale] ?? q.text.en, author: q.author };
}
