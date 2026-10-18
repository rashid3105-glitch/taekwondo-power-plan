import { useNavigate, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Image as ImageIcon, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { trackCta } from "@/lib/ctaTracking";
import { useIsMobile } from "@/hooks/use-mobile";
import { EditableImage } from "@/components/EditableImage";

const IMGS = import.meta.glob("@/assets/draft/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
const img = (k: string) => Object.entries(IMGS).find(([p]) => p.endsWith(`/${k}.jpg`))?.[1];

// Draft benefit subpages linked from /draft-home. Not public, noindex.
const C = { bg: "#FFFFFF", soft: "#F5F7FB", ink: "#0F172A", muted: "#526079", line: "#E4E8F0", blue: "#1F5BD8", gold: "#C9A227" };

export const BENEFIT_SLUGS = ["spar-tid", "trivsel", "roed-traad", "videoanalyse"] as const;
type Slug = (typeof BENEFIT_SLUGS)[number];

type Page = { h1: string; problem: string; intro: string; points: { t: string; d: string }[] };
type UI = { back: string; draft: string; readMore: string; problemLabel: string; howLabel: string; img: string; imgHint: string; before: string; after: string; ctaTitle: string; ctaTrial: string; ctaDemo: string };

export const UI_COPY: Record<string, UI> = {
  da: { back: "Tilbage til overblikket", draft: "Udkast — ikke offentligt", readMore: "Læs mere", problemLabel: "Udfordringen", howLabel: "Sådan hjælper Sportstalent", img: "Billede kommer her", imgHint: "Pladsholder til skærmbillede fra appen", before: "Før", after: "Med Sportstalent", ctaTitle: "Klar til at prøve det i jeres klub?", ctaTrial: "Prøv gratis i 1 måned", ctaDemo: "Book en kort demo" },
  en: { back: "Back to overview", draft: "Draft — not public", readMore: "Read more", problemLabel: "The challenge", howLabel: "How Sportstalent helps", img: "Image goes here", imgHint: "Placeholder for an app screenshot", before: "Before", after: "With Sportstalent", ctaTitle: "Ready to try it in your club?", ctaTrial: "Try free for 1 month", ctaDemo: "Book a short demo" },
  sv: { back: "Tillbaka till översikten", draft: "Utkast — inte offentligt", readMore: "Läs mer", problemLabel: "Utmaningen", howLabel: "Så hjälper Sportstalent", img: "Bild kommer här", imgHint: "Platshållare för skärmbild från appen", before: "Före", after: "Med Sportstalent", ctaTitle: "Redo att prova i er klubb?", ctaTrial: "Prova gratis i 1 månad", ctaDemo: "Boka en kort demo" },
  de: { back: "Zurück zur Übersicht", draft: "Entwurf — nicht öffentlich", readMore: "Mehr erfahren", problemLabel: "Die Herausforderung", howLabel: "So hilft Sportstalent", img: "Bild folgt hier", imgHint: "Platzhalter für einen App-Screenshot", before: "Vorher", after: "Mit Sportstalent", ctaTitle: "Bereit, es in Ihrem Verein zu testen?", ctaTrial: "1 Monat kostenlos testen", ctaDemo: "Kurze Demo buchen" },
  ar: { back: "العودة إلى النظرة العامة", draft: "مسودة — غير منشورة", readMore: "اقرأ المزيد", problemLabel: "التحدي", howLabel: "كيف يساعد Sportstalent", img: "الصورة هنا", imgHint: "مكان مؤقت لصورة من التطبيق", before: "قبل", after: "مع Sportstalent", ctaTitle: "مستعد لتجربته في ناديك؟", ctaTrial: "جرّب مجانًا لمدة شهر", ctaDemo: "احجز عرضًا قصيرًا" },
  no: { back: "Tilbake til oversikten", draft: "Utkast — ikke offentlig", readMore: "Les mer", problemLabel: "Utfordringen", howLabel: "Slik hjelper Sportstalent", img: "Bilde kommer her", imgHint: "Plassholder for skjermbilde fra appen", before: "Før", after: "Med Sportstalent", ctaTitle: "Klar til å prøve det i klubben?", ctaTrial: "Prøv gratis i 1 måned", ctaDemo: "Book en kort demo" },
  es: { back: "Volver al resumen", draft: "Borrador — no público", readMore: "Leer más", problemLabel: "El reto", howLabel: "Cómo ayuda Sportstalent", img: "Imagen aquí", imgHint: "Espacio para una captura de la app", before: "Antes", after: "Con Sportstalent", ctaTitle: "¿Listo para probarlo en tu club?", ctaTrial: "Prueba gratis 1 mes", ctaDemo: "Reserva una demo corta" },
};

const P: Record<string, Record<Slug, Page>> = {
  da: {
    "spar-tid": { h1: "Mindre administration. Mere tid på måtten.", problem: "Trænere bruger timer hver uge på Messenger-grupper, regneark og de samme spørgsmål fra forældre.", intro: "Sportstalent samler det hele ét sted, så planlægning og kommunikation tager minutter i stedet for timer.", points: [
      { t: "Alt samlet ét sted", d: "Sæsonplan, ugeplaner, fremmøde og øvelser ligger i samme app — ingen leden i mapper og tråde." },
      { t: "Hurtig ugeplanlægning", d: "Genbrug skabeloner og øvelsesbiblioteket i stedet for at starte forfra hver uge." },
      { t: "Én fælles beskedkanal", d: "Skriv til hele holdet eller én atlet uden private telefonnumre og uoverskuelige chats." } ] },
    trivsel: { h1: "Opdag overbelastning og mistrivsel i tide.", problem: "Unge atleter siger sjældent selv til, når de sover dårligt, er pressede i skolen eller har ondt — før det bliver til skader eller frafald.", intro: "Med et kort dagligt tjek får træneren et ærligt billede af holdet, før træningen starter.", points: [
      { t: "30 sekunders tjek", d: "Atleten registrerer søvn, energi og ømhed før træning — hurtigt og enkelt på mobilen." },
      { t: "Overblik for træneren", d: "Se på et øjeblik, hvem der er klar, og hvem der skal have tilpasset belastningen i dag." },
      { t: "Genoptræning i fællesskab", d: "Træner og atlet følger samme forløb, så comebacket sker sikkert og i rette tempo." } ] },
    "roed-traad": { h1: "Én fælles udviklingslinje — uanset hvem der træner holdet.", problem: "Hvert hold bliver let sin egen ø. Når en træner stopper, eller en atlet rykker op, starter man forfra.", intro: "Sportstalent giver klubben et fælles grundlag, som følger atleten fra første træning til eliten.", points: [
      { t: "Fælles retning og progression", d: "Byg klubbens standarder for teknik, styrke og motorik fra ungdom til senior." },
      { t: "Gnidningsfri overlevering", d: "Nye trænere ser atletens historik, tests og udvikling over tid fra dag ét." },
      { t: "Atleter der bliver", d: "Kontinuitet og tryghed — også når atleten skifter hold eller træner." } ] },
    videoanalyse: { h1: "Se kampen igen — og forstå den.", problem: "Trænere filmer kampe på telefonen, men har sjældent tid til at gennemgå dem. Feedbacken drukner i en gruppechat.", intro: "Upload kampvideoen, og få pointtavle, tidslinje og en kamprapport, som træneren kan finjustere og dele.", points: [
      { t: "Officiel pointtavle og tidslinje", d: "Registrér spark, træffere og advarsler for rød og blå — klik på en hændelse for at hoppe til stedet i videoen." },
      { t: "Automatisk kamprapport", d: "Kamp-IQ, banekontrol, sparketeknik, momentum og konkrete råd til næste træning. Træneren retter det til." },
      { t: "Rapport og deling", d: "Eksportér en grafisk PDF med pointkurve og statistik, eller del et link med atleten og forældrene." } ] },
  },
  en: {
    "spar-tid": { h1: "Less admin. More time on the mat.", problem: "Coaches spend hours every week on group chats, spreadsheets and the same questions from parents.", intro: "Sportstalent keeps everything in one place, so planning and communication take minutes instead of hours.", points: [
      { t: "Everything in one place", d: "Season plan, weekly plans, attendance and exercises in one app — no hunting through folders and threads." },
      { t: "Fast weekly planning", d: "Reuse templates and the exercise library instead of starting over every week." },
      { t: "One shared message channel", d: "Message the whole team or one athlete without private phone numbers or messy chats." } ] },
    trivsel: { h1: "Spot overload and low wellbeing in time.", problem: "Young athletes rarely speak up when they sleep badly, are stressed at school or in pain — until it becomes an injury or dropout.", intro: "A short daily check gives the coach an honest picture of the team before training starts.", points: [
      { t: "30-second check-in", d: "Athletes log sleep, energy and soreness before training — quick and easy on their phone." },
      { t: "Overview for the coach", d: "See at a glance who is ready and who needs a lighter load today." },
      { t: "Rehab together", d: "Coach and athlete follow the same plan, so the comeback is safe and well paced." } ] },
    "roed-traad": { h1: "One shared development path — whoever coaches the team.", problem: "Each team easily becomes its own island. When a coach leaves or an athlete moves up, you start over.", intro: "Sportstalent gives the club a shared foundation that follows the athlete from first session to elite.", points: [
      { t: "Shared direction and progression", d: "Build the club's standards for technique, strength and movement from youth to senior." },
      { t: "Smooth handover", d: "New coaches see the athlete's history, tests and progress from day one." },
      { t: "Athletes who stay", d: "Continuity and security — even when athletes change team or coach." } ] },
    videoanalyse: { h1: "Watch the match again — and understand it.", problem: "Coaches film matches on their phone but rarely have time to review them. Feedback gets lost in a group chat.", intro: "Upload the match video and get a scoreboard, timeline and match report the coach can fine-tune and share.", points: [
      { t: "Official scoreboard and timeline", d: "Log kicks, hits and penalties for red and blue — tap an event to jump to that moment in the video." },
      { t: "Automatic match report", d: "Fight IQ, ring control, kick technique, momentum and concrete tips for the next session. The coach adjusts it." },
      { t: "Report and sharing", d: "Export a visual PDF with score curve and statistics, or share a link with the athlete and parents." } ] },
  },
  sv: {
    "spar-tid": { h1: "Mindre administration. Mer tid på mattan.", problem: "Tränare lägger timmar varje vecka på chattgrupper, kalkylark och samma frågor från föräldrar.", intro: "Sportstalent samlar allt på ett ställe, så planering och kommunikation tar minuter i stället för timmar.", points: [
      { t: "Allt på ett ställe", d: "Säsongsplan, veckoplaner, närvaro och övningar i samma app." },
      { t: "Snabb veckoplanering", d: "Återanvänd mallar och övningsbiblioteket i stället för att börja om varje vecka." },
      { t: "En gemensam kanal", d: "Skriv till hela laget eller en idrottare utan privata nummer och röriga chattar." } ] },
    trivsel: { h1: "Upptäck överbelastning och dåligt mående i tid.", problem: "Unga idrottare säger sällan till när de sover dåligt, är stressade eller har ont — förrän det blir skador eller avhopp.", intro: "En kort daglig koll ger tränaren en ärlig bild av laget innan träningen börjar.", points: [
      { t: "30 sekunders koll", d: "Idrottaren loggar sömn, energi och ömhet före träning — snabbt i mobilen." },
      { t: "Överblick för tränaren", d: "Se direkt vem som är redo och vem som behöver lägre belastning i dag." },
      { t: "Rehab tillsammans", d: "Tränare och idrottare följer samma plan för en säker comeback." } ] },
    "roed-traad": { h1: "En gemensam utvecklingslinje — oavsett tränare.", problem: "Varje lag blir lätt en egen ö. När en tränare slutar eller en idrottare flyttas upp börjar man om.", intro: "Sportstalent ger klubben en gemensam grund som följer idrottaren hela vägen.", points: [
      { t: "Gemensam riktning", d: "Bygg klubbens standarder för teknik, styrka och motorik från ungdom till senior." },
      { t: "Smidig överlämning", d: "Nya tränare ser idrottarens historik, tester och utveckling från dag ett." },
      { t: "Idrottare som stannar", d: "Kontinuitet och trygghet — även vid byte av lag eller tränare." } ] },
    videoanalyse: { h1: "Se matchen igen — och förstå den.", problem: "Tränare filmar matcher med mobilen men hinner sällan gå igenom dem. Feedbacken drunknar i en gruppchatt.", intro: "Ladda upp matchvideon och få poängtavla, tidslinje och en matchrapport som tränaren kan finjustera och dela.", points: [
      { t: "Officiell poängtavla och tidslinje", d: "Registrera sparkar, träffar och varningar för röd och blå — klicka på en händelse för att hoppa dit i videon." },
      { t: "Automatisk matchrapport", d: "Match-IQ, ringkontroll, sparkteknik, momentum och konkreta råd. Tränaren justerar." },
      { t: "Rapport och delning", d: "Exportera en grafisk PDF med poängkurva och statistik, eller dela en länk med idrottaren och föräldrarna." } ] },
  },
  de: {
    "spar-tid": { h1: "Weniger Verwaltung. Mehr Zeit auf der Matte.", problem: "Trainer verbringen jede Woche Stunden mit Gruppenchats, Tabellen und denselben Fragen der Eltern.", intro: "Sportstalent bündelt alles an einem Ort — Planung und Kommunikation dauern Minuten statt Stunden.", points: [
      { t: "Alles an einem Ort", d: "Saisonplan, Wochenpläne, Anwesenheit und Übungen in einer App." },
      { t: "Schnelle Wochenplanung", d: "Vorlagen und Übungsbibliothek wiederverwenden statt jede Woche neu anzufangen." },
      { t: "Ein gemeinsamer Kanal", d: "Nachrichten an das ganze Team oder einzelne Athleten ohne private Nummern." } ] },
    trivsel: { h1: "Überlastung und Unwohlsein rechtzeitig erkennen.", problem: "Junge Athleten sagen selten etwas, wenn sie schlecht schlafen, gestresst sind oder Schmerzen haben — bis es zu Verletzungen oder Abbrüchen kommt.", intro: "Ein kurzer täglicher Check gibt dem Trainer ein ehrliches Bild vor dem Training.", points: [
      { t: "30-Sekunden-Check", d: "Athleten erfassen Schlaf, Energie und Muskelkater vor dem Training — schnell am Handy." },
      { t: "Überblick für Trainer", d: "Auf einen Blick sehen, wer bereit ist und wer heute weniger Belastung braucht." },
      { t: "Reha gemeinsam", d: "Trainer und Athlet folgen demselben Plan für ein sicheres Comeback." } ] },
    "roed-traad": { h1: "Ein gemeinsamer Entwicklungsweg — egal welcher Trainer.", problem: "Jedes Team wird leicht zur eigenen Insel. Wenn ein Trainer geht oder ein Athlet aufsteigt, beginnt alles von vorn.", intro: "Sportstalent gibt dem Verein eine gemeinsame Grundlage, die den Athleten begleitet.", points: [
      { t: "Gemeinsame Richtung", d: "Vereinsstandards für Technik, Kraft und Motorik von Jugend bis Senioren." },
      { t: "Reibungslose Übergabe", d: "Neue Trainer sehen Verlauf, Tests und Entwicklung ab dem ersten Tag." },
      { t: "Athleten, die bleiben", d: "Kontinuität und Sicherheit — auch bei Team- oder Trainerwechsel." } ] },
    videoanalyse: { h1: "Den Kampf noch einmal sehen — und verstehen.", problem: "Trainer filmen Kämpfe mit dem Handy, haben aber selten Zeit für die Auswertung. Feedback geht im Gruppenchat unter.", intro: "Kampfvideo hochladen und Punktetafel, Zeitleiste und Kampfbericht erhalten, die der Trainer anpassen und teilen kann.", points: [
      { t: "Offizielle Punktetafel und Zeitleiste", d: "Tritte, Treffer und Verwarnungen für Rot und Blau erfassen — ein Klick springt zur Stelle im Video." },
      { t: "Automatischer Kampfbericht", d: "Kampf-IQ, Flächenkontrolle, Tritttechnik, Momentum und konkrete Tipps. Der Trainer passt an." },
      { t: "Bericht und Teilen", d: "Grafisches PDF mit Punktekurve und Statistik exportieren oder einen Link mit Athlet und Eltern teilen." } ] },
  },
  ar: {
    "spar-tid": { h1: "إدارة أقل. وقت أكثر على البساط.", problem: "يقضي المدربون ساعات كل أسبوع في مجموعات الدردشة والجداول والإجابة على نفس أسئلة أولياء الأمور.", intro: "يجمع Sportstalent كل شيء في مكان واحد، فيستغرق التخطيط والتواصل دقائق بدل ساعات.", points: [
      { t: "كل شيء في مكان واحد", d: "خطة الموسم والخطط الأسبوعية والحضور والتمارين في تطبيق واحد." },
      { t: "تخطيط أسبوعي سريع", d: "أعد استخدام القوالب ومكتبة التمارين بدل البدء من جديد كل أسبوع." },
      { t: "قناة رسائل موحدة", d: "راسل الفريق كله أو رياضيًا واحدًا دون أرقام خاصة أو محادثات فوضوية." } ] },
    trivsel: { h1: "اكتشف الإرهاق وتراجع الحالة في الوقت المناسب.", problem: "نادرًا ما يتحدث الرياضيون الصغار عن قلة النوم أو الضغط أو الألم — حتى يتحول ذلك إلى إصابة أو انسحاب.", intro: "فحص يومي قصير يمنح المدرب صورة صادقة عن الفريق قبل التدريب.", points: [
      { t: "فحص في 30 ثانية", d: "يسجل الرياضي النوم والطاقة والألم قبل التدريب بسرعة على الهاتف." },
      { t: "نظرة عامة للمدرب", d: "اعرف بنظرة واحدة من هو جاهز ومن يحتاج حملًا أخف اليوم." },
      { t: "إعادة التأهيل معًا", d: "يتبع المدرب والرياضي نفس الخطة لعودة آمنة." } ] },
    "roed-traad": { h1: "مسار تطوير مشترك — أيًا كان المدرب.", problem: "يصبح كل فريق جزيرة منفصلة بسهولة. عندما يغادر مدرب أو يترقى رياضي، يبدأ كل شيء من جديد.", intro: "يمنح Sportstalent النادي أساسًا مشتركًا يرافق الرياضي طوال مسيرته.", points: [
      { t: "اتجاه مشترك", d: "ابنِ معايير النادي للتقنية والقوة والحركة من الناشئين إلى الكبار." },
      { t: "تسليم سلس", d: "يرى المدربون الجدد تاريخ الرياضي واختباراته وتطوره من اليوم الأول." },
      { t: "رياضيون يبقون", d: "استمرارية وأمان — حتى عند تغيير الفريق أو المدرب." } ] },
    videoanalyse: { h1: "شاهد المباراة مجددًا — وافهمها.", problem: "يصوّر المدربون المباريات بالهاتف لكن نادرًا ما يجدون وقتًا لمراجعتها، وتضيع الملاحظات في الدردشات.", intro: "ارفع فيديو المباراة واحصل على لوحة نقاط وخط زمني وتقرير يمكن للمدرب تعديله ومشاركته.", points: [
      { t: "لوحة نقاط وخط زمني رسميان", d: "سجّل الركلات والإصابات والإنذارات للأحمر والأزرق — اضغط على حدث للانتقال إليه في الفيديو." },
      { t: "تقرير مباراة تلقائي", d: "ذكاء القتال والسيطرة على الحلبة وتقنية الركل والزخم ونصائح عملية. يعدّله المدرب." },
      { t: "تقرير ومشاركة", d: "صدّر ملف PDF مرئيًا بمنحنى النقاط والإحصاءات، أو شارك رابطًا مع الرياضي وأولياء الأمور." } ] },
  },
  no: {
    "spar-tid": { h1: "Mindre administrasjon. Mer tid på matta.", problem: "Trenere bruker timer hver uke på chattegrupper, regneark og de samme spørsmålene fra foreldre.", intro: "Sportstalent samler alt på ett sted, så planlegging og kommunikasjon tar minutter i stedet for timer.", points: [
      { t: "Alt på ett sted", d: "Sesongplan, ukeplaner, oppmøte og øvelser i samme app." },
      { t: "Rask ukeplanlegging", d: "Gjenbruk maler og øvelsesbiblioteket i stedet for å starte på nytt hver uke." },
      { t: "Én felles kanal", d: "Skriv til hele laget eller én utøver uten private nummer og rotete chatter." } ] },
    trivsel: { h1: "Oppdag overbelastning og mistrivsel i tide.", problem: "Unge utøvere sier sjelden fra når de sover dårlig, er stresset eller har vondt — før det blir skader eller frafall.", intro: "En kort daglig sjekk gir treneren et ærlig bilde av laget før treningen.", points: [
      { t: "30 sekunders sjekk", d: "Utøveren registrerer søvn, energi og stølhet før trening — raskt på mobilen." },
      { t: "Oversikt for treneren", d: "Se med ett blikk hvem som er klare og hvem som trenger lavere belastning i dag." },
      { t: "Opptrening sammen", d: "Trener og utøver følger samme plan for et trygt comeback." } ] },
    "roed-traad": { h1: "Én felles utviklingslinje — uansett trener.", problem: "Hvert lag blir lett sin egen øy. Når en trener slutter eller en utøver rykker opp, starter man på nytt.", intro: "Sportstalent gir klubben et felles grunnlag som følger utøveren hele veien.", points: [
      { t: "Felles retning", d: "Bygg klubbens standarder for teknikk, styrke og motorikk fra ungdom til senior." },
      { t: "Sømløs overlevering", d: "Nye trenere ser historikk, tester og utvikling fra dag én." },
      { t: "Utøvere som blir", d: "Kontinuitet og trygghet — også ved bytte av lag eller trener." } ] },
    videoanalyse: { h1: "Se kampen igjen — og forstå den.", problem: "Trenere filmer kamper på mobilen, men har sjelden tid til å gå gjennom dem. Tilbakemeldingen drukner i en gruppechat.", intro: "Last opp kampvideoen og få poengtavle, tidslinje og en kamprapport treneren kan finjustere og dele.", points: [
      { t: "Offisiell poengtavle og tidslinje", d: "Registrer spark, treff og advarsler for rød og blå — trykk på en hendelse for å hoppe dit i videoen." },
      { t: "Automatisk kamprapport", d: "Kamp-IQ, banekontroll, sparketeknikk, momentum og konkrete råd. Treneren justerer." },
      { t: "Rapport og deling", d: "Eksporter en grafisk PDF med poengkurve og statistikk, eller del en lenke med utøveren og foreldrene." } ] },
  },
  es: {
    "spar-tid": { h1: "Menos administración. Más tiempo en el tatami.", problem: "Los entrenadores pasan horas cada semana en chats, hojas de cálculo y las mismas preguntas de los padres.", intro: "Sportstalent lo reúne todo en un lugar: planificar y comunicar lleva minutos, no horas.", points: [
      { t: "Todo en un lugar", d: "Plan de temporada, planes semanales, asistencia y ejercicios en una sola app." },
      { t: "Planificación rápida", d: "Reutiliza plantillas y la biblioteca de ejercicios en lugar de empezar de cero." },
      { t: "Un canal compartido", d: "Escribe a todo el equipo o a un deportista sin números privados ni chats caóticos." } ] },
    trivsel: { h1: "Detecta sobrecarga y malestar a tiempo.", problem: "Los jóvenes rara vez avisan cuando duermen mal, están estresados o tienen dolor — hasta que hay lesiones o abandonos.", intro: "Un breve control diario da al entrenador una imagen honesta del equipo antes de entrenar.", points: [
      { t: "Control de 30 segundos", d: "El deportista registra sueño, energía y molestias antes de entrenar, desde el móvil." },
      { t: "Visión para el entrenador", d: "Ve de un vistazo quién está listo y quién necesita menos carga hoy." },
      { t: "Recuperación conjunta", d: "Entrenador y deportista siguen el mismo plan para un regreso seguro." } ] },
    "roed-traad": { h1: "Una línea de desarrollo común — sea cual sea el entrenador.", problem: "Cada equipo se convierte fácilmente en una isla. Cuando un entrenador se va o un deportista sube, se empieza de cero.", intro: "Sportstalent da al club una base común que acompaña al deportista todo el camino.", points: [
      { t: "Dirección común", d: "Crea los estándares del club en técnica, fuerza y motricidad de base a sénior." },
      { t: "Relevo sin fricciones", d: "Los nuevos entrenadores ven historial, tests y progreso desde el primer día." },
      { t: "Deportistas que se quedan", d: "Continuidad y seguridad, incluso al cambiar de equipo o entrenador." } ] },
    videoanalyse: { h1: "Vuelve a ver el combate — y entiéndelo.", problem: "Los entrenadores graban combates con el móvil pero rara vez tienen tiempo de revisarlos. El feedback se pierde en un chat.", intro: "Sube el vídeo y obtén marcador, línea de tiempo e informe del combate que el entrenador puede ajustar y compartir.", points: [
      { t: "Marcador oficial y línea de tiempo", d: "Registra patadas, impactos y amonestaciones para rojo y azul; toca un evento para saltar a ese momento." },
      { t: "Informe automático", d: "IQ de combate, control del área, técnica de patada, momentum y consejos concretos. El entrenador lo ajusta." },
      { t: "Informe y compartir", d: "Exporta un PDF visual con curva de puntos y estadísticas, o comparte un enlace con el deportista y los padres." } ] },
  },
};

function Placeholder({ label, hint, tall, slot }: { label: string; hint: string; tall?: boolean; slot: string }) {
  return (
    <EditableImage
      slot={`draft-${slot}`}
      fallback={img(slot)}
      loading="lazy"
      style={{ width: "100%", aspectRatio: tall ? "4 / 3" : "16 / 9", objectFit: "cover", objectPosition: "top", borderRadius: 20, border: `1px solid ${C.line}`, boxShadow: "0 20px 40px -24px rgba(15,23,42,0.4)", display: "block" }}
      placeholder={
        <div style={{ aspectRatio: tall ? "4 / 3" : "16 / 9", borderRadius: 20, border: `2px dashed ${C.line}`, background: `linear-gradient(135deg, rgba(31,91,216,0.06), rgba(201,162,39,0.10))`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: C.muted, textAlign: "center", padding: 16 }}>
          <ImageIcon size={32} color={C.blue} />
          <div style={{ fontWeight: 700, color: C.ink }}>{label}</div>
          <div style={{ fontSize: 13 }}>{hint}</div>
        </div>
      }
    />
  );
}

export default function DraftBenefit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const m = useIsMobile();
  if (!slug || !(BENEFIT_SLUGS as readonly string[]).includes(slug)) return <Navigate to="/draft-home" replace />;
  const u = UI_COPY[locale] ?? UI_COPY.en;
  const p = (P[locale] ?? P.en)[slug as Slug];
  const pad = m ? 20 : 40;
  const primary: React.CSSProperties = { padding: "15px 28px", borderRadius: 999, border: "none", background: C.blue, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" };
  const secondary: React.CSSProperties = { padding: "15px 28px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer" };

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: "100vh" }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <div style={{ background: C.gold, textAlign: "center", fontSize: 12, fontWeight: 700, padding: "6px 0" }}>{u.draft}</div>
      <header style={{ maxWidth: 1120, margin: "0 auto", padding: `16px ${pad}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <BrandLogo height={m ? 34 : 40} textColor={C.ink} accentColor={C.gold} />
        <LanguageSwitcher />
      </header>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: `${m ? 16 : 32}px ${pad}px ${m ? 40 : 64}px` }}>
        <button onClick={() => navigate("/draft-home")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.blue, fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 24 }}>
          <ArrowLeft size={16} style={{ transform: locale === "ar" ? "scaleX(-1)" : undefined }} />{u.back}
        </button>
        <h1 style={{ fontSize: m ? 32 : 48, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 18px" }}>{p.h1}</h1>
        <p style={{ fontSize: m ? 16 : 19, color: C.muted, lineHeight: 1.55, margin: "0 0 32px" }}>{p.intro}</p>
        <Placeholder label={u.img} hint={u.imgHint} src={img(`${slug}-hero`)} />
      </section>

      <section style={{ background: C.soft }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: `${m ? 40 : 64}px ${pad}px` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{u.problemLabel}</div>
          <p style={{ fontSize: m ? 20 : 24, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{p.problem}</p>
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: `${m ? 48 : 80}px ${pad}px` }}>
        <h2 style={{ fontSize: m ? 24 : 32, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 40px", textAlign: "center" }}>{u.howLabel}</h2>
        <div style={{ display: "grid", gap: m ? 40 : 56 }}>
          {p.points.map((pt, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: m ? 20 : 40, alignItems: "center" }}>
              <div style={{ order: m ? 0 : i % 2 ? 1 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(31,91,216,0.1)", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={18} /></div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{pt.t}</h3>
                </div>
                <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.6, margin: 0 }}>{pt.d}</p>
              </div>
              <Placeholder label={u.img} hint={u.imgHint} tall src={img(`${slug}-${i + 1}`)} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: C.soft }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: `${m ? 48 : 80}px ${pad}px`, textAlign: "center" }}>
          <h2 style={{ fontSize: m ? 24 : 32, fontWeight: 800, margin: "0 0 24px" }}>{u.ctaTitle}</h2>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={primary} onClick={() => { trackCta(`draft_${slug}_trial`); navigate("/contact"); }}>{u.ctaTrial}</button>
            <button style={secondary} onClick={() => { trackCta(`draft_${slug}_demo`); navigate("/contact"); }}>{u.ctaDemo}</button>
          </div>
        </div>
      </section>
      <footer style={{ textAlign: "center", padding: "28px 20px", fontSize: 13, color: C.muted }}>© Sportstalent.dk</footer>
    </div>
  );
}
