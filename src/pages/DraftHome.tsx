import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Clock, HeartPulse, Route as RouteIcon, Check, Video } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { trackCta } from "@/lib/ctaTracking";
import { useIsMobile } from "@/hooks/use-mobile";
import coachSitting from "@/assets/coach-sitting.png";
import { BENEFIT_SLUGS, UI_COPY } from "./DraftBenefit";

// Draft of a lighter, simpler front page. Not linked anywhere, noindex.
const C = {
  bg: "#FFFFFF",
  soft: "#F5F7FB",
  ink: "#0F172A",
  muted: "#526079",
  line: "#E4E8F0",
  blue: "#1F5BD8",
  gold: "#C9A227",
};

type Copy = {
  draft: string; login: string;
  h1: string; h1em: string; sub: string; ctaTrial: string; ctaDemo: string; micro: string;
  bTitle: string; b: { t: string; d: string }[];
  fQuote: string; fRole: string;
  pTitle: string; pAmount: string; pPer: string; pNote: string; pList: string[]; pCta: string; pAnalysis: string;
};

const COPY: Record<string, Copy> = {
  da: {
    draft: "Udkast — ikke offentligt", login: "Log ind",
    h1: "Ét system til hele klubben. ", h1em: "Mindre papirarbejde, mere udvikling.",
    sub: "Træningsplaner, fremmøde, trivsel og beskeder samlet ét sted — så trænerne kan bruge tiden på atleterne.",
    ctaTrial: "Prøv gratis i 1 måned", ctaDemo: "Book en kort demo", micro: "Ingen binding · GDPR-klar · Dansk support",
    bTitle: "Det får klubben ud af det",
    b: [
      { t: "Spar tid i hverdagen", d: "Slip for regneark og spredte beskeder. Alt ligger ét sted." },
      { t: "Se hvordan atleterne har det", d: "Trivsel og restitution før træning — så I opdager problemer i tide." },
      { t: "Rød tråd i hele klubben", d: "Samme udvikling, uanset hvilken træner der står på måtten." },
      { t: "Video- og kampanalyse", d: "Pointtavle, tidslinje og automatisk kamprapport — klar til at dele." },
    ],
    fQuote: "Jeg har bygget det system, jeg selv manglede som træner.", fRole: "Grundlægger · 40+ års erfaring i sporten",
    pTitle: "Én enkel pris for hele klubben", pAmount: "7.500 kr.", pPer: "/år ekskl. moms", pNote: "Op til 50 medlemmer",
    pList: ["Alle trænere og atleter", "Forældre får gratis læseadgang", "1 gratis måned at starte på"],
    pCta: "Kom i gang", pAnalysis: "Ikke klar endnu? Tag den gratis klubanalyse",
  },
  en: {
    draft: "Draft — not public", login: "Log in",
    h1: "One system for the whole club. ", h1em: "Less paperwork, more development.",
    sub: "Training plans, attendance, wellbeing and messages in one place — so coaches can spend their time on athletes.",
    ctaTrial: "Try free for 1 month", ctaDemo: "Book a short demo", micro: "No commitment · GDPR-ready · Personal support",
    bTitle: "What your club gets",
    b: [
      { t: "Save time every week", d: "No more spreadsheets and scattered messages. Everything in one place." },
      { t: "See how athletes are doing", d: "Wellbeing and recovery before training — spot problems in time." },
      { t: "A common thread", d: "The same development path, whichever coach is on the mat." },
      { t: "Video and match analysis", d: "Scoreboard, timeline and an automatic match report — ready to share." },
    ],
    fQuote: "I built the system I always missed as a coach.", fRole: "Founder · 40+ years in the sport",
    pTitle: "One simple price for the whole club", pAmount: "DKK 7,500", pPer: "/year excl. VAT", pNote: "Up to 50 members",
    pList: ["All coaches and athletes", "Parents get free read access", "1 free month to start"],
    pCta: "Get started", pAnalysis: "Not ready yet? Take the free club analysis",
  },
  sv: {
    draft: "Utkast — inte offentligt", login: "Logga in",
    h1: "Ett system för hela klubben. ", h1em: "Mindre pappersarbete, mer utveckling.",
    sub: "Träningsplaner, närvaro, välmående och meddelanden på ett ställe — så tränarna kan lägga tiden på idrottarna.",
    ctaTrial: "Prova gratis i 1 månad", ctaDemo: "Boka en kort demo", micro: "Ingen bindning · GDPR-redo · Personlig support",
    bTitle: "Det här får klubben",
    b: [
      { t: "Spara tid i vardagen", d: "Slipp kalkylark och utspridda meddelanden. Allt på ett ställe." },
      { t: "Se hur idrottarna mår", d: "Välmående och återhämtning före träning — upptäck problem i tid." },
      { t: "Röd tråd i hela klubben", d: "Samma utveckling, oavsett vilken tränare som står på mattan." },
      { t: "Video- och matchanalys", d: "Poängtavla, tidslinje och automatisk matchrapport — klar att dela." },
    ],
    fQuote: "Jag byggde systemet jag själv saknade som tränare.", fRole: "Grundare · 40+ år inom idrotten",
    pTitle: "Ett enkelt pris för hela klubben", pAmount: "7 500 DKK", pPer: "/år exkl. moms", pNote: "Upp till 50 medlemmar",
    pList: ["Alla tränare och idrottare", "Föräldrar får gratis läsåtkomst", "1 gratis månad att börja med"],
    pCta: "Kom igång", pAnalysis: "Inte redo än? Gör den gratis klubbanalysen",
  },
  de: {
    draft: "Entwurf — nicht öffentlich", login: "Anmelden",
    h1: "Ein System für den ganzen Verein. ", h1em: "Weniger Papierkram, mehr Entwicklung.",
    sub: "Trainingspläne, Anwesenheit, Wohlbefinden und Nachrichten an einem Ort — damit Trainer Zeit für ihre Athleten haben.",
    ctaTrial: "1 Monat kostenlos testen", ctaDemo: "Kurze Demo buchen", micro: "Keine Bindung · DSGVO-konform · Persönlicher Support",
    bTitle: "Das bekommt Ihr Verein",
    b: [
      { t: "Zeit sparen im Alltag", d: "Schluss mit Tabellen und verstreuten Nachrichten. Alles an einem Ort." },
      { t: "Sehen, wie es den Athleten geht", d: "Wohlbefinden und Erholung vor dem Training — Probleme früh erkennen." },
      { t: "Ein roter Faden", d: "Dieselbe Entwicklung, egal welcher Trainer auf der Matte steht." },
      { t: "Video- und Kampfanalyse", d: "Punktetafel, Zeitleiste und automatischer Kampfbericht — bereit zum Teilen." },
    ],
    fQuote: "Ich habe das System gebaut, das mir als Trainer immer gefehlt hat.", fRole: "Gründer · 40+ Jahre im Sport",
    pTitle: "Ein einfacher Preis für den ganzen Verein", pAmount: "7.500 DKK", pPer: "/Jahr zzgl. MwSt.", pNote: "Bis zu 50 Mitglieder",
    pList: ["Alle Trainer und Athleten", "Eltern erhalten kostenlosen Lesezugriff", "1 Gratismonat zum Start"],
    pCta: "Loslegen", pAnalysis: "Noch nicht bereit? Machen Sie die kostenlose Vereinsanalyse",
  },
  ar: {
    draft: "مسودة — غير منشورة", login: "تسجيل الدخول",
    h1: "نظام واحد للنادي بأكمله. ", h1em: "أعمال ورقية أقل، تطوير أكثر.",
    sub: "خطط التدريب والحضور والرفاهية والرسائل في مكان واحد — ليتفرغ المدربون للرياضيين.",
    ctaTrial: "جرّب مجانًا لمدة شهر", ctaDemo: "احجز عرضًا قصيرًا", micro: "بدون التزام · متوافق مع GDPR · دعم شخصي",
    bTitle: "ما يحصل عليه ناديكم",
    b: [
      { t: "وفّر الوقت يوميًا", d: "وداعًا للجداول والرسائل المتفرقة. كل شيء في مكان واحد." },
      { t: "اعرف حال الرياضيين", d: "الرفاهية والتعافي قبل التدريب — لاكتشاف المشكلات مبكرًا." },
      { t: "خيط مشترك في النادي", d: "نفس مسار التطوير أيًا كان المدرب." },
      { t: "تحليل الفيديو والمباريات", d: "لوحة نقاط وخط زمني وتقرير مباراة تلقائي — جاهز للمشاركة." },
    ],
    fQuote: "بنيت النظام الذي كنت أفتقده كمدرب.", fRole: "المؤسس · أكثر من 40 عامًا في الرياضة",
    pTitle: "سعر واحد بسيط للنادي بأكمله", pAmount: "7,500 كرونة", pPer: "/سنة بدون ضريبة", pNote: "حتى 50 عضوًا",
    pList: ["جميع المدربين والرياضيين", "وصول مجاني للقراءة لأولياء الأمور", "شهر مجاني للبداية"],
    pCta: "ابدأ الآن", pAnalysis: "لست مستعدًا بعد؟ قم بتحليل النادي المجاني",
  },
  no: {
    draft: "Utkast — ikke offentlig", login: "Logg inn",
    h1: "Ett system for hele klubben. ", h1em: "Mindre papirarbeid, mer utvikling.",
    sub: "Treningsplaner, oppmøte, trivsel og meldinger samlet på ett sted — så trenerne kan bruke tiden på utøverne.",
    ctaTrial: "Prøv gratis i 1 måned", ctaDemo: "Book en kort demo", micro: "Ingen binding · GDPR-klar · Personlig støtte",
    bTitle: "Dette får klubben",
    b: [
      { t: "Spar tid i hverdagen", d: "Slipp regneark og spredte meldinger. Alt på ett sted." },
      { t: "Se hvordan utøverne har det", d: "Trivsel og restitusjon før trening — oppdag problemer i tide." },
      { t: "Rød tråd i hele klubben", d: "Samme utvikling, uansett hvilken trener som står på matta." },
      { t: "Video- og kampanalyse", d: "Poengtavle, tidslinje og automatisk kamprapport — klar til deling." },
    ],
    fQuote: "Jeg bygde systemet jeg selv manglet som trener.", fRole: "Grunnlegger · 40+ år i idretten",
    pTitle: "Én enkel pris for hele klubben", pAmount: "7 500 DKK", pPer: "/år eks. mva.", pNote: "Opptil 50 medlemmer",
    pList: ["Alle trenere og utøvere", "Foreldre får gratis lesetilgang", "1 gratis måned å starte med"],
    pCta: "Kom i gang", pAnalysis: "Ikke klar ennå? Ta den gratis klubbanalysen",
  },
  es: {
    draft: "Borrador — no público", login: "Iniciar sesión",
    h1: "Un sistema para todo el club. ", h1em: "Menos papeleo, más desarrollo.",
    sub: "Planes de entrenamiento, asistencia, bienestar y mensajes en un solo lugar — para que los entrenadores se centren en los deportistas.",
    ctaTrial: "Prueba gratis 1 mes", ctaDemo: "Reserva una demo corta", micro: "Sin permanencia · Cumple el RGPD · Soporte personal",
    bTitle: "Lo que obtiene tu club",
    b: [
      { t: "Ahorra tiempo cada semana", d: "Adiós a hojas de cálculo y mensajes dispersos. Todo en un lugar." },
      { t: "Ve cómo están los deportistas", d: "Bienestar y recuperación antes de entrenar — detecta problemas a tiempo." },
      { t: "Un hilo conductor", d: "El mismo desarrollo, sea cual sea el entrenador." },
      { t: "Análisis de vídeo y combates", d: "Marcador, línea de tiempo e informe automático del combate, listo para compartir." },
    ],
    fQuote: "Construí el sistema que siempre eché de menos como entrenador.", fRole: "Fundador · 40+ años en el deporte",
    pTitle: "Un precio sencillo para todo el club", pAmount: "7.500 DKK", pPer: "/año sin IVA", pNote: "Hasta 50 miembros",
    pList: ["Todos los entrenadores y deportistas", "Los padres tienen acceso de lectura gratis", "1 mes gratis para empezar"],
    pCta: "Empezar", pAnalysis: "¿Aún no estás listo? Haz el análisis de club gratuito",
  },
};

const ICONS = [Clock, HeartPulse, RouteIcon, Video];

export default function DraftHome() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const m = useIsMobile();
  const k = COPY[locale] ?? COPY.en;
  const pad = m ? 20 : 40;

  const primary: React.CSSProperties = { padding: m ? "14px 22px" : "15px 28px", borderRadius: 999, border: "none", background: C.blue, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px -10px rgba(31,91,216,0.6)" };
  const secondary: React.CSSProperties = { padding: m ? "14px 22px" : "15px 28px", borderRadius: 999, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 15, fontWeight: 600, cursor: "pointer" };

  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: "100vh" }}>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div style={{ background: C.gold, color: C.ink, textAlign: "center", fontSize: 12, fontWeight: 700, padding: "6px 0" }}>{k.draft}</div>

      <header style={{ maxWidth: 1120, margin: "0 auto", padding: `16px ${pad}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ color: C.ink }}><BrandLogo height={m ? 34 : 40} textColor={C.ink} accentColor={C.gold} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LanguageSwitcher />
          <button onClick={() => navigate("/auth")} style={{ ...secondary, padding: "8px 16px", fontSize: 14, whiteSpace: "nowrap" }}>{k.login}</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: `${m ? 24 : 56}px ${pad}px ${m ? 48 : 80}px`, display: "grid", gridTemplateColumns: m ? "1fr" : "1.1fr 1fr", gap: m ? 32 : 56, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: m ? 34 : 54, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 18px" }}>
            {k.h1}<span style={{ color: C.blue }}>{k.h1em}</span>
          </h1>
          <p style={{ fontSize: m ? 16 : 19, lineHeight: 1.55, color: C.muted, margin: "0 0 28px", maxWidth: 520 }}>{k.sub}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={primary} onClick={() => { trackCta("draft_hero_trial"); navigate("/contact"); }}>{k.ctaTrial}</button>
            <button style={secondary} onClick={() => { trackCta("draft_hero_demo"); navigate("/contact"); }}>{k.ctaDemo}</button>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: C.muted }}>{k.micro}</div>
        </div>
        <div style={{ position: "relative" }}>
          <div aria-hidden style={{ position: "absolute", inset: m ? "-12px" : "-24px", background: `linear-gradient(135deg, rgba(31,91,216,0.12), rgba(201,162,39,0.18))`, borderRadius: 32 }} />
          <img src={coachSitting} alt="" width={1200} height={1200} style={{ position: "relative", width: "100%", height: "auto", borderRadius: 24, display: "block", boxShadow: "0 30px 60px -30px rgba(15,23,42,0.35)" }} />
        </div>
      </section>

      {/* Benefits */}
      <section style={{ background: C.soft }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: `${m ? 56 : 88}px ${pad}px` }}>
          <h2 style={{ fontSize: m ? 26 : 36, fontWeight: 800, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 40px" }}>{k.bTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(2,1fr)", gap: 20 }}>
            {k.b.map((b, i) => {
              const Icon = ICONS[i];
              return (
                <button key={i} onClick={() => navigate(`/draft-home/${BENEFIT_SLUGS[i]}`)} style={{ textAlign: "start", font: "inherit", color: "inherit", cursor: "pointer", background: "#fff", borderRadius: 20, padding: 28, border: `1px solid ${C.line}`, transition: "transform .15s, box-shadow .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 36px -20px rgba(15,23,42,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(31,91,216,0.1)", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><Icon size={24} /></div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{b.t}</div>
                  <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.55 }}>{b.d}</div>
                  <div style={{ marginTop: 16, color: C.blue, fontWeight: 700, fontSize: 14 }}>{(UI_COPY[locale] ?? UI_COPY.en).readMore} {locale === "ar" ? "←" : "→"}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: `${m ? 56 : 88}px ${pad}px`, display: "flex", flexDirection: m ? "column" : "row", alignItems: "center", gap: 28, textAlign: m ? "center" : "start" }}>
        <img src="/founder-farooq.jpg" alt="Farooq Rashid" width={120} height={120} loading="lazy" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: `4px solid ${C.gold}`, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: m ? 20 : 24, fontWeight: 600, lineHeight: 1.4, margin: "0 0 12px" }}>“{k.fQuote}”</p>
          <div style={{ fontWeight: 700 }}>Farooq Rashid</div>
          <div style={{ fontSize: 14, color: C.muted }}>{k.fRole}</div>
        </div>
      </section>

      {/* Price + CTA */}
      <section style={{ background: C.soft }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: `${m ? 56 : 88}px ${pad}px`, textAlign: "center" }}>
          <h2 style={{ fontSize: m ? 26 : 36, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 28px" }}>{k.pTitle}</h2>
          <div style={{ background: "#fff", borderRadius: 24, padding: m ? 28 : 40, border: `1px solid ${C.line}`, boxShadow: "0 20px 50px -30px rgba(15,23,42,0.3)" }}>
            <div style={{ fontSize: m ? 40 : 48, fontWeight: 800, letterSpacing: "-0.03em" }}>{k.pAmount}<span style={{ fontSize: 15, fontWeight: 500, color: C.muted, marginInlineStart: 6 }}>{k.pPer}</span></div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{k.pNote}</div>
            <div style={{ display: "grid", gap: 10, margin: "24px 0", textAlign: "start" }}>
              {k.pList.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 15 }}><Check size={18} color={C.blue} />{p}</div>
              ))}
            </div>
            <button style={{ ...primary, width: "100%" }} onClick={() => { trackCta("draft_price_cta"); navigate("/contact"); }}>{k.pCta}</button>
          </div>
          <button onClick={() => { trackCta("draft_analysis"); navigate("/klubanalyse"); }} style={{ marginTop: 20, background: "none", border: "none", color: C.blue, fontSize: 14, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>{k.pAnalysis} →</button>
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "28px 20px", fontSize: 13, color: C.muted }}>© Sportstalent.dk</footer>
    </div>
  );
}
