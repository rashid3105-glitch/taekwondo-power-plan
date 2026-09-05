import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Link, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SPORTSTALENT'
const APP_URL = 'https://sportstalent.dk'

type Loc = 'en' | 'da' | 'sv' | 'de' | 'ar' | 'no' | 'es'
const RTL: Loc[] = ['ar']

interface Strings {
  subject: (child: string) => string
  preview: (child: string) => string
  heading: string
  intro: (child: string, club: string) => string
  covered: string
  bullets: string[]
  when: string
  withdrawTitle: string
  withdraw: string
  policyLink: string
  signOff: string
}

const S: Record<Loc, Strings> = {
  en: {
    subject: (c) => `Receipt: consent given for ${c}`,
    preview: (c) => `Your approval for ${c} has been registered`,
    heading: 'Consent registered',
    intro: (c, k) => `Thank you. You have approved that ${k} may process health data for ${c}.`,
    covered: 'What you approved',
    bullets: [
      'Heart rate and heart-rate variability from training',
      'Sleep, steps and weight the athlete registers',
      'Mental self-assessments the athlete fills in',
    ],
    when: 'Registered',
    withdrawTitle: 'Changed your mind?',
    withdraw: 'Contact the club and the approval is withdrawn. Processing then stops.',
    policyLink: 'Privacy policy',
    signOff: 'Sportstalent',
  },
  da: {
    subject: (c) => `Kvittering: samtykke givet for ${c}`,
    preview: (c) => `Din godkendelse for ${c} er registreret`,
    heading: 'Samtykke registreret',
    intro: (c, k) => `Tak. Du har godkendt, at ${k} m\u00e5 behandle helbredsdata for ${c}.`,
    covered: 'Det har du godkendt',
    bullets: [
      'Puls og pulsvariation fra tr\u00e6ning',
      'S\u00f8vn, skridt og v\u00e6gt som atleten registrerer',
      'Mentale selvvurderinger som atleten udfylder',
    ],
    when: 'Registreret',
    withdrawTitle: 'Fortrudt?',
    withdraw: 'Kontakt klubben, s\u00e5 tr\u00e6kkes godkendelsen tilbage, og behandlingen stopper.',
    policyLink: 'Privatlivspolitik',
    signOff: 'Sportstalent',
  },
  sv: {
    subject: (c) => `Kvitto: samtycke givet f\u00f6r ${c}`,
    preview: (c) => `Ditt godk\u00e4nnande f\u00f6r ${c} \u00e4r registrerat`,
    heading: 'Samtycke registrerat',
    intro: (c, k) => `Tack. Du har godk\u00e4nt att ${k} f\u00e5r behandla h\u00e4lsodata f\u00f6r ${c}.`,
    covered: 'Det h\u00e4r har du godk\u00e4nt',
    bullets: [
      'Puls och pulsvariation fr\u00e5n tr\u00e4ning',
      'S\u00f6mn, steg och vikt som idrottaren registrerar',
      'Mentala sj\u00e4lvskattningar som idrottaren fyller i',
    ],
    when: 'Registrerat',
    withdrawTitle: '\u00c5ngrat dig?',
    withdraw: 'Kontakta klubben s\u00e5 \u00e5terkallas godk\u00e4nnandet och behandlingen upph\u00f6r.',
    policyLink: 'Integritetspolicy',
    signOff: 'Sportstalent',
  },
  de: {
    subject: (c) => `Best\u00e4tigung: Einwilligung f\u00fcr ${c}`,
    preview: (c) => `Ihre Zustimmung f\u00fcr ${c} wurde registriert`,
    heading: 'Einwilligung registriert',
    intro: (c, k) => `Vielen Dank. Sie haben zugestimmt, dass ${k} Gesundheitsdaten von ${c} verarbeiten darf.`,
    covered: 'Das haben Sie genehmigt',
    bullets: [
      'Herzfrequenz und Herzfrequenzvariabilit\u00e4t aus dem Training',
      'Schlaf, Schritte und Gewicht, die der Athlet eintr\u00e4gt',
      'Mentale Selbsteinsch\u00e4tzungen',
    ],
    when: 'Registriert',
    withdrawTitle: 'Meinung ge\u00e4ndert?',
    withdraw: 'Kontaktieren Sie den Verein; die Zustimmung wird widerrufen und die Verarbeitung endet.',
    policyLink: 'Datenschutz',
    signOff: 'Sportstalent',
  },
  ar: {
    subject: (c) => `\u0625\u064a\u0635\u0627\u0644: \u062a\u0645 \u0645\u0646\u062d \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0644\u0640 ${c}`,
    preview: (c) => `\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0645\u0648\u0627\u0641\u0642\u062a\u0643 \u0644\u0640 ${c}`,
    heading: '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629',
    intro: (c, k) => `\u0634\u0643\u0631\u0627\u064b. \u0644\u0642\u062f \u0648\u0627\u0641\u0642\u062a \u0639\u0644\u0649 \u0623\u0646 \u064a\u0639\u0627\u0644\u062c ${k} \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0635\u062d\u064a\u0629 \u0644\u0640 ${c}.`,
    covered: '\u0645\u0627 \u0648\u0627\u0641\u0642\u062a \u0639\u0644\u064a\u0647',
    bullets: [
      '\u0645\u0639\u062f\u0644 \u0636\u0631\u0628\u0627\u062a \u0627\u0644\u0642\u0644\u0628 \u0648\u062a\u063a\u0627\u064a\u0631\u0647',
      '\u0627\u0644\u0646\u0648\u0645 \u0648\u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0648\u0627\u0644\u0648\u0632\u0646',
      '\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0627\u0644\u0630\u0627\u062a\u064a\u0629 \u0627\u0644\u0630\u0647\u0646\u064a\u0629',
    ],
    when: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u0633\u062c\u064a\u0644',
    withdrawTitle: '\u063a\u064a\u0651\u0631\u062a \u0631\u0623\u064a\u0643\u061f',
    withdraw: '\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0646\u0627\u062f\u064a \u0644\u0633\u062d\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629.',
    policyLink: '\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629',
    signOff: 'Sportstalent',
  },
  no: {
    subject: (c) => `Kvittering: samtykke gitt for ${c}`,
    preview: (c) => `Din godkjenning for ${c} er registrert`,
    heading: 'Samtykke registrert',
    intro: (c, k) => `Takk. Du har godkjent at ${k} kan behandle helsedata for ${c}.`,
    covered: 'Dette har du godkjent',
    bullets: [
      'Puls og pulsvariasjon fra trening',
      'S\u00f8vn, skritt og vekt som ut\u00f8veren registrerer',
      'Mentale egenvurderinger',
    ],
    when: 'Registrert',
    withdrawTitle: 'Ombestemt deg?',
    withdraw: 'Kontakt klubben, s\u00e5 trekkes godkjenningen tilbake og behandlingen stopper.',
    policyLink: 'Personvern',
    signOff: 'Sportstalent',
  },
  es: {
    subject: (c) => `Recibo: consentimiento dado para ${c}`,
    preview: (c) => `Tu aprobaci\u00f3n para ${c} ha quedado registrada`,
    heading: 'Consentimiento registrado',
    intro: (c, k) => `Gracias. Has aprobado que ${k} trate los datos de salud de ${c}.`,
    covered: 'Lo que has aprobado',
    bullets: [
      'Frecuencia card\u00edaca y variabilidad durante el entrenamiento',
      'Sue\u00f1o, pasos y peso que registra el atleta',
      'Autoevaluaciones mentales',
    ],
    when: 'Registrado',
    withdrawTitle: '\u00bfHas cambiado de opini\u00f3n?',
    withdraw: 'Contacta con el club y la aprobaci\u00f3n se retira; el tratamiento se detiene.',
    policyLink: 'Pol\u00edtica de privacidad',
    signOff: 'Sportstalent',
  },
}

function pick(locale?: string): { loc: Loc; s: Strings } {
  const l = (locale || 'da').slice(0, 2).toLowerCase() as Loc
  return { loc: S[l] ? l : 'en', s: S[l] ?? S.en }
}

interface Props {
  athleteName?: string
  clubName?: string
  grantedAt?: string
  policyVersion?: string
  locale?: string
}

const ConsentReceiptEmail = ({ athleteName, clubName, grantedAt, policyVersion, locale }: Props) => {
  const { loc, s } = pick(locale)
  const child = athleteName || (loc === 'da' ? 'dit barn' : 'your child')
  const club = clubName || SITE_NAME
  const when = grantedAt ? new Date(grantedAt).toLocaleString(loc) : null

  return (
    <Html lang={loc} dir={RTL.includes(loc) ? 'rtl' : 'ltr'}>
      <Head />
      <Preview>{s.preview(child)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={eyebrow}>{club} {"\u00b7"} {SITE_NAME}</Text>
            <Heading style={h1}>{s.heading}</Heading>
          </Section>

          <Text style={text}>{s.intro(child, club)}</Text>

          <Section style={factBox}>
            <Text style={factTitle}>{s.covered}</Text>
            {s.bullets.map((b, i) => (
              <Text key={i} style={factLine}>&bull; {b}</Text>
            ))}
            {when && <Text style={factLine}>{s.when}: {when}</Text>}
            {policyVersion && <Text style={factLine}>Policy: {policyVersion}</Text>}
          </Section>

          <Hr style={hr} />

          <Text style={factTitle}>{s.withdrawTitle}</Text>
          <Text style={small}>{s.withdraw}</Text>
          <Text style={small}>
            <Link href={`${APP_URL}/privacy`} style={linkStyle}>{s.policyLink}</Link>
          </Text>
          <Text style={footer}>{"\u2014"} {s.signOff}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ConsentReceiptEmail,
  subject: (d: Record<string, any>) => {
    const { loc, s } = pick(d.locale)
    return s.subject(d.athleteName || (loc === 'da' ? 'dit barn' : 'your child'))
  },
  displayName: 'Consent receipt',
  previewData: {
    athleteName: 'Sara',
    clubName: 'Aarhus Taekwondo',
    grantedAt: new Date().toISOString(),
    policyVersion: '2026-06-13',
    locale: 'da',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #D4AF37', paddingBottom: '12px', marginBottom: '20px' }
const eyebrow = { fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b7280', margin: '0 0 6px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0B0C14', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const factBox = { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px 16px', margin: '0 0 8px' }
const factTitle = { fontSize: '13px', fontWeight: 700 as const, color: '#0B0C14', margin: '0 0 8px' }
const factLine = { fontSize: '13px', color: '#374151', lineHeight: '1.6', margin: '0 0 6px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const small = { fontSize: '12px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 12px' }
const linkStyle = { color: '#0B0C14', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
