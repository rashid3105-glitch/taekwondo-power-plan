import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button, Link, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SPORTSTALENT'
const APP_URL = 'https://sportstalent.dk'

type Loc = 'en' | 'da' | 'sv' | 'de' | 'ar' | 'no' | 'es'

const RTL: Loc[] = ['ar']

interface Strings {
  subject: (child: string, club: string) => string
  preview: (child: string, club: string) => string
  heading: (child: string, club: string) => string
  reminderHeading: (child: string) => string
  /** Above the fold: what happens without action, and by when. */
  deadline: (child: string, days: number) => string
  intro: (child: string, club: string, coach: string | null) => string
  cta: string
  collectedTitle: string
  bullets: string[]
  minutes: string
  withdraw: string
  notMyChild: string
  fallback: string
  policyLink: string
  termsLink: string
  signOff: string
}

const S: Record<Loc, Strings> = {
  en: {
    subject: (c, k) => `Consent needed for ${c} at ${k}`,
    preview: (c) => `${c} cannot use health tracking until you approve`,
    heading: (c, k) => `Consent needed for ${c} at ${k}`,
    reminderHeading: (c) => `Still waiting: consent for ${c}`,
    deadline: (c, d) =>
      `Until you approve, ${c}'s health tracking stays switched off. This link expires in ${d} days, and after that the club must start over.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} at ${k}` : k} has set up a training account for ${c}. Because ${c} is a minor, a parent or guardian must approve before the club may work with health data.`,
    cta: 'Approve now',
    collectedTitle: 'What is collected',
    bullets: [
      'Heart rate and heart-rate variability from training',
      'Sleep, steps and weight the athlete registers',
      'Mental self-assessments the athlete fills in',
    ],
    minutes: 'Takes about a minute. No account and no password needed.',
    withdraw: 'You can withdraw your approval at any time.',
    notMyChild:
      'Not this child\u2019s parent or guardian? Open the link and choose \u201cThis is not my child\u201d \u2014 the club is notified and we stop emailing you.',
    fallback: 'If the button does not work, copy this link into your browser:',
    policyLink: 'Privacy policy',
    termsLink: 'Terms',
    signOff: 'Sportstalent',
  },
  da: {
    subject: (c, k) => `Samtykke n\u00f8dvendigt for ${c} i ${k}`,
    preview: (c) => `${c} kan ikke bruge helbredsdata, f\u00f8r du godkender`,
    heading: (c, k) => `Samtykke n\u00f8dvendigt for ${c} i ${k}`,
    reminderHeading: (c) => `Vi mangler stadig dit samtykke for ${c}`,
    deadline: (c, d) =>
      `Indtil du godkender, er registrering af ${c}s helbredsdata sl\u00e5et fra. Linket udl\u00f8ber om ${d} dage, og derefter skal klubben starte forfra.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} i ${k}` : k} har oprettet en tr\u00e6ningsprofil til ${c}. Fordi ${c} er under 18 \u00e5r, skal en for\u00e6lder eller v\u00e6rge godkende, f\u00f8r klubben m\u00e5 arbejde med helbredsdata.`,
    cta: 'Godkend nu',
    collectedTitle: 'Det bliver indsamlet',
    bullets: [
      'Puls og pulsvariation fra tr\u00e6ning',
      'S\u00f8vn, skridt og v\u00e6gt som atleten registrerer',
      'Mentale selvvurderinger som atleten udfylder',
    ],
    minutes: 'Det tager cirka et minut. Hverken konto eller adgangskode er n\u00f8dvendig.',
    withdraw: 'Du kan tr\u00e6kke din godkendelse tilbage n\u00e5r som helst.',
    notMyChild:
      'Er du ikke for\u00e6lder eller v\u00e6rge for barnet? \u00c5bn linket og v\u00e6lg \u201cDet er ikke mit barn\u201d \u2014 s\u00e5 f\u00e5r klubben besked, og vi holder op med at skrive til dig.',
    fallback: 'Virker knappen ikke, kan du kopiere dette link ind i din browser:',
    policyLink: 'Privatlivspolitik',
    termsLink: 'Betingelser',
    signOff: 'Sportstalent',
  },
  sv: {
    subject: (c, k) => `Samtycke beh\u00f6vs f\u00f6r ${c} i ${k}`,
    preview: (c) => `${c} kan inte anv\u00e4nda h\u00e4lsodata f\u00f6rr\u00e4n du godk\u00e4nner`,
    heading: (c, k) => `Samtycke beh\u00f6vs f\u00f6r ${c} i ${k}`,
    reminderHeading: (c) => `Vi v\u00e4ntar fortfarande p\u00e5 samtycke f\u00f6r ${c}`,
    deadline: (c, d) =>
      `Tills du godk\u00e4nner \u00e4r registrering av ${c}s h\u00e4lsodata avst\u00e4ngd. L\u00e4nken g\u00e5r ut om ${d} dagar, sedan m\u00e5ste klubben b\u00f6rja om.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} i ${k}` : k} har skapat ett tr\u00e4ningskonto f\u00f6r ${c}. Eftersom ${c} \u00e4r minder\u00e5rig m\u00e5ste en v\u00e5rdnadshavare godk\u00e4nna innan klubben f\u00e5r arbeta med h\u00e4lsodata.`,
    cta: 'Godk\u00e4nn nu',
    collectedTitle: 'Det h\u00e4r samlas in',
    bullets: [
      'Puls och pulsvariation fr\u00e5n tr\u00e4ning',
      'S\u00f6mn, steg och vikt som idrottaren registrerar',
      'Mentala sj\u00e4lvskattningar som idrottaren fyller i',
    ],
    minutes: 'Tar ungef\u00e4r en minut. Inget konto och inget l\u00f6senord beh\u00f6vs.',
    withdraw: 'Du kan \u00e5terkalla ditt godk\u00e4nnande n\u00e4r som helst.',
    notMyChild:
      '\u00c4r du inte v\u00e5rdnadshavare f\u00f6r barnet? \u00d6ppna l\u00e4nken och v\u00e4lj \u201cDet h\u00e4r \u00e4r inte mitt barn\u201d \u2014 klubben meddelas och vi slutar mejla dig.',
    fallback: 'Om knappen inte fungerar, kopiera den h\u00e4r l\u00e4nken till din webbl\u00e4sare:',
    policyLink: 'Integritetspolicy',
    termsLink: 'Villkor',
    signOff: 'Sportstalent',
  },
  de: {
    subject: (c, k) => `Einwilligung erforderlich f\u00fcr ${c} bei ${k}`,
    preview: (c) => `${c} kann Gesundheitsdaten erst nach Ihrer Zustimmung nutzen`,
    heading: (c, k) => `Einwilligung erforderlich f\u00fcr ${c} bei ${k}`,
    reminderHeading: (c) => `Wir warten noch auf die Einwilligung f\u00fcr ${c}`,
    deadline: (c, d) =>
      `Bis Sie zustimmen, bleibt die Erfassung der Gesundheitsdaten von ${c} ausgeschaltet. Der Link l\u00e4uft in ${d} Tagen ab, danach muss der Verein neu beginnen.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} bei ${k}` : k} hat ein Trainingskonto f\u00fcr ${c} eingerichtet. Da ${c} minderj\u00e4hrig ist, muss ein Elternteil oder Vormund zustimmen, bevor der Verein mit Gesundheitsdaten arbeiten darf.`,
    cta: 'Jetzt zustimmen',
    collectedTitle: 'Das wird erfasst',
    bullets: [
      'Herzfrequenz und Herzfrequenzvariabilit\u00e4t aus dem Training',
      'Schlaf, Schritte und Gewicht, die der Athlet eintr\u00e4gt',
      'Mentale Selbsteinsch\u00e4tzungen, die der Athlet ausf\u00fcllt',
    ],
    minutes: 'Dauert etwa eine Minute. Kein Konto und kein Passwort n\u00f6tig.',
    withdraw: 'Sie k\u00f6nnen Ihre Zustimmung jederzeit widerrufen.',
    notMyChild:
      'Sie sind nicht Elternteil oder Vormund dieses Kindes? \u00d6ffnen Sie den Link und w\u00e4hlen Sie \u201eDas ist nicht mein Kind\u201c \u2014 der Verein wird informiert und wir schreiben Ihnen nicht mehr.',
    fallback: 'Falls die Schaltfl\u00e4che nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:',
    policyLink: 'Datenschutz',
    termsLink: 'Bedingungen',
    signOff: 'Sportstalent',
  },
  ar: {
    subject: (c, k) => `\u0645\u0637\u0644\u0648\u0628 \u0645\u0648\u0627\u0641\u0642\u0629 \u0644\u0640 ${c} \u0641\u064a ${k}`,
    preview: (c) => `\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u0633\u062c\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a ${c} \u0627\u0644\u0635\u062d\u064a\u0629 \u0642\u0628\u0644 \u0645\u0648\u0627\u0641\u0642\u062a\u0643`,
    heading: (c, k) => `\u0645\u0637\u0644\u0648\u0628 \u0645\u0648\u0627\u0641\u0642\u0629 \u0644\u0640 ${c} \u0641\u064a ${k}`,
    reminderHeading: (c) => `\u0645\u0627 \u0632\u0644\u0646\u0627 \u0646\u0646\u062a\u0638\u0631 \u0645\u0648\u0627\u0641\u0642\u062a\u0643 \u0644\u0640 ${c}`,
    deadline: (c, d) =>
      `\u062d\u062a\u0649 \u062a\u0648\u0627\u0641\u0642\u060c \u064a\u0628\u0642\u0649 \u062a\u0633\u062c\u064a\u0644 \u0628\u064a\u0627\u0646\u0627\u062a ${c} \u0627\u0644\u0635\u062d\u064a\u0629 \u0645\u0639\u0637\u0644\u0627\u064b. \u064a\u0646\u062a\u0647\u064a \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u062e\u0644\u0627\u0644 ${d} \u064a\u0648\u0645\u0627\u064b.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} \u0641\u064a ${k}` : k} \u0623\u0646\u0634\u0623 \u062d\u0633\u0627\u0628 \u062a\u062f\u0631\u064a\u0628 \u0644\u0640 ${c}. \u0648\u0644\u0623\u0646 ${c} \u0642\u0627\u0635\u0631\u060c \u064a\u062c\u0628 \u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0644\u064a \u0627\u0644\u0623\u0645\u0631 \u0642\u0628\u0644 \u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0635\u062d\u064a\u0629.`,
    cta: '\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0622\u0646',
    collectedTitle: '\u0645\u0627 \u064a\u062a\u0645 \u062c\u0645\u0639\u0647',
    bullets: [
      '\u0645\u0639\u062f\u0644 \u0636\u0631\u0628\u0627\u062a \u0627\u0644\u0642\u0644\u0628 \u0648\u062a\u063a\u0627\u064a\u0631\u0647 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u062f\u0631\u064a\u0628',
      '\u0627\u0644\u0646\u0648\u0645 \u0648\u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0648\u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u062a\u064a \u064a\u0633\u062c\u0644\u0647\u0627 \u0627\u0644\u0631\u064a\u0627\u0636\u064a',
      '\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0627\u0644\u0630\u0627\u062a\u064a\u0629 \u0627\u0644\u0630\u0647\u0646\u064a\u0629',
    ],
    minutes: '\u064a\u0633\u062a\u063a\u0631\u0642 \u062f\u0642\u064a\u0642\u0629 \u062a\u0642\u0631\u064a\u0628\u0627\u064b. \u0644\u0627 \u062d\u0627\u062c\u0629 \u0644\u062d\u0633\u0627\u0628 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631.',
    withdraw: '\u064a\u0645\u0643\u0646\u0643 \u0633\u062d\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0641\u064a \u0623\u064a \u0648\u0642\u062a.',
    notMyChild:
      '\u0644\u0633\u062a \u0648\u0644\u064a \u0623\u0645\u0631 \u0647\u0630\u0627 \u0627\u0644\u0637\u0641\u0644\u061f \u0627\u0641\u062a\u062d \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u0627\u062e\u062a\u0631 \u201c\u0647\u0630\u0627 \u0644\u064a\u0633 \u0637\u0641\u0644\u064a\u201d.',
    fallback: '\u0625\u0630\u0627 \u0644\u0645 \u064a\u0639\u0645\u0644 \u0627\u0644\u0632\u0631\u060c \u0627\u0646\u0633\u062e \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637:',
    policyLink: '\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629',
    termsLink: '\u0627\u0644\u0634\u0631\u0648\u0637',
    signOff: 'Sportstalent',
  },
  no: {
    subject: (c, k) => `Samtykke n\u00f8dvendig for ${c} i ${k}`,
    preview: (c) => `${c} kan ikke bruke helsedata f\u00f8r du godkjenner`,
    heading: (c, k) => `Samtykke n\u00f8dvendig for ${c} i ${k}`,
    reminderHeading: (c) => `Vi venter fortsatt p\u00e5 samtykke for ${c}`,
    deadline: (c, d) =>
      `Inntil du godkjenner, er registrering av ${c}s helsedata sl\u00e5tt av. Lenken utl\u00f8per om ${d} dager, og da m\u00e5 klubben begynne p\u00e5 nytt.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} i ${k}` : k} har opprettet en treningskonto for ${c}. Fordi ${c} er mindre\u00e5rig, m\u00e5 en forelder eller verge godkjenne f\u00f8r klubben kan jobbe med helsedata.`,
    cta: 'Godkjenn n\u00e5',
    collectedTitle: 'Dette samles inn',
    bullets: [
      'Puls og pulsvariasjon fra trening',
      'S\u00f8vn, skritt og vekt som ut\u00f8veren registrerer',
      'Mentale egenvurderinger som ut\u00f8veren fyller ut',
    ],
    minutes: 'Tar omtrent ett minutt. Ingen konto og ingen passord.',
    withdraw: 'Du kan trekke tilbake godkjenningen n\u00e5r som helst.',
    notMyChild:
      'Er du ikke forelder eller verge for barnet? \u00c5pne lenken og velg \u201cDette er ikke mitt barn\u201d \u2014 klubben blir varslet og vi slutter \u00e5 sende e-post.',
    fallback: 'Hvis knappen ikke virker, kopier denne lenken inn i nettleseren:',
    policyLink: 'Personvern',
    termsLink: 'Vilk\u00e5r',
    signOff: 'Sportstalent',
  },
  es: {
    subject: (c, k) => `Se necesita consentimiento para ${c} en ${k}`,
    preview: (c) => `${c} no puede usar datos de salud hasta que lo apruebes`,
    heading: (c, k) => `Se necesita consentimiento para ${c} en ${k}`,
    reminderHeading: (c) => `Seguimos esperando el consentimiento para ${c}`,
    deadline: (c, d) =>
      `Hasta que lo apruebes, el registro de los datos de salud de ${c} permanece desactivado. El enlace caduca en ${d} d\u00edas.`,
    intro: (c, k, coach) =>
      `${coach ? `${coach} en ${k}` : k} ha creado una cuenta de entrenamiento para ${c}. Como ${c} es menor de edad, un padre, madre o tutor debe dar su aprobaci\u00f3n antes de que el club pueda tratar datos de salud.`,
    cta: 'Aprobar ahora',
    collectedTitle: 'Qu\u00e9 se recoge',
    bullets: [
      'Frecuencia card\u00edaca y variabilidad durante el entrenamiento',
      'Sue\u00f1o, pasos y peso que registra el atleta',
      'Autoevaluaciones mentales que completa el atleta',
    ],
    minutes: 'Tarda alrededor de un minuto. Sin cuenta ni contrase\u00f1a.',
    withdraw: 'Puedes retirar tu aprobaci\u00f3n en cualquier momento.',
    notMyChild:
      '\u00bfNo eres el padre, madre o tutor? Abre el enlace y elige \u201cEste no es mi hijo\u201d: el club recibe el aviso y dejamos de escribirte.',
    fallback: 'Si el bot\u00f3n no funciona, copia este enlace en tu navegador:',
    policyLink: 'Pol\u00edtica de privacidad',
    termsLink: 'T\u00e9rminos',
    signOff: 'Sportstalent',
  },
}

function pick(locale?: string): { loc: Loc; s: Strings } {
  const l = (locale || 'da').slice(0, 2).toLowerCase() as Loc
  return { loc: S[l] ? l : 'en', s: S[l] ?? S.en }
}

interface Props {
  athleteName?: string
  consentUrl?: string
  expiresInDays?: number
  clubName?: string
  coachName?: string
  locale?: string
  /** 0 = first send, 1..n = reminder number */
  reminderNumber?: number
  daysLeft?: number
}

const ParentalConsentEmail = ({
  athleteName, consentUrl, expiresInDays, clubName, coachName, reminderNumber, daysLeft, locale,
}: Props) => {
  const { loc, s } = pick(locale)
  const child = athleteName || (loc === 'da' ? 'dit barn' : 'your child')
  const club = clubName || SITE_NAME
  const isReminder = (reminderNumber ?? 0) > 0
  const days = daysLeft ?? expiresInDays ?? 30

  return (
    <Html lang={loc} dir={RTL.includes(loc) ? 'rtl' : 'ltr'}>
      <Head />
      <Preview>{s.preview(child, club)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={eyebrow}>{club} {"\u00b7"} {SITE_NAME}</Text>
            <Heading style={h1}>
              {isReminder ? s.reminderHeading(child) : s.heading(child, club)}
            </Heading>
          </Section>

          {/* Above the fold: consequence + deadline, then a single button. */}
          <Text style={lead}>{s.deadline(child, days)}</Text>

          {consentUrl && (
            <Section style={{ textAlign: 'center' as const, margin: '20px 0 24px' }}>
              <Button style={buttonStyle} href={consentUrl}>{s.cta}</Button>
            </Section>
          )}

          <Text style={text}>{s.intro(child, club, coachName || null)}</Text>

          <Section style={factBox}>
            <Text style={factTitle}>{s.collectedTitle}</Text>
            {s.bullets.map((b, i) => (
              <Text key={i} style={factLine}>&bull; {b}</Text>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Below the fold */}
          <Text style={small}>{s.minutes}</Text>
          <Text style={small}>{s.withdraw}</Text>
          <Text style={small}>{s.notMyChild}</Text>
          <Text style={small}>
            {s.fallback}<br />{consentUrl}
          </Text>
          <Text style={small}>
            <Link href={`${APP_URL}/privacy`} style={linkStyle}>{s.policyLink}</Link>
            {'  \u00b7  '}
            <Link href={`${APP_URL}/terms`} style={linkStyle}>{s.termsLink}</Link>
          </Text>
          <Text style={footer}>{"\u2014"} {s.signOff}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ParentalConsentEmail,
  subject: (d: Record<string, any>) => {
    const { loc, s } = pick(d.locale)
    const child = d.athleteName || (loc === 'da' ? 'dit barn' : 'your child')
    return s.subject(child, d.clubName || SITE_NAME)
  },
  displayName: 'Parental consent request',
  previewData: {
    athleteName: 'Sara',
    clubName: 'Aarhus Taekwondo',
    coachName: 'Milad',
    consentUrl: 'https://sportstalent.dk/consent/example-token',
    expiresInDays: 30,
    reminderNumber: 0,
    locale: 'da',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #D4AF37', paddingBottom: '12px', marginBottom: '20px' }
const eyebrow = { fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b7280', margin: '0 0 6px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0B0C14', margin: '0' }
const lead = { fontSize: '16px', color: '#111827', lineHeight: '1.6', margin: '0 0 8px', fontWeight: 600 as const }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const factBox = { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px 16px', margin: '0 0 8px' }
const factTitle = { fontSize: '13px', fontWeight: 700 as const, color: '#0B0C14', margin: '0 0 8px' }
const factLine = { fontSize: '13px', color: '#374151', lineHeight: '1.6', margin: '0 0 6px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const small = { fontSize: '12px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 12px', wordBreak: 'break-word' as const }
const linkStyle = { color: '#0B0C14', textDecoration: 'underline' }
const buttonStyle = {
  backgroundColor: '#D4AF37',
  color: '#0B0C14',
  padding: '14px 28px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: '700' as const,
  fontSize: '15px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
