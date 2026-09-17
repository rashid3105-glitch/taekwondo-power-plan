import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

type Locale = 'en' | 'da' | 'sv' | 'de' | 'ar' | 'no' | 'es'

interface Props {
  /** 'account' | 'video' | 'club' */
  kind?: string
  recipientName?: string
  /** Title of the video, or name of the club — empty for accounts. */
  subjectLabel?: string
  /** ISO date the deletion happens. */
  deleteOn?: string
  locale?: Locale
}

const COPY: Record<Locale, {
  dir: 'ltr' | 'rtl'
  subject: (k: string) => string
  heading: string
  hi: (n: string) => string
  account: (d: string) => string
  video: (t: string, d: string) => string
  club: (c: string, d: string) => string
  keep: string
  footer: string
}> = {
  en: {
    dir: 'ltr',
    subject: () => 'Scheduled deletion of your data',
    heading: 'Scheduled deletion',
    hi: (n) => `Hi ${n},`,
    account: (d) => `Your ${SITE_NAME} account has been inactive for almost 12 months. Under our retention schedule it will be deleted on ${d}, together with your training and health data.`,
    video: (t, d) => `The video recording "${t}" reaches our 24-month retention limit and will be deleted on ${d}, including tags, notes and drawings.`,
    club: (c, d) => `The licence for ${c} has ended. Under our retention schedule the club's athlete data will be deleted on ${d}. Export what you need before that date.`,
    keep: 'Simply sign in before that date if you want to keep the data — signing in resets the deadline.',
    footer: 'This is an automated message about data retention.',
  },
  da: {
    dir: 'ltr',
    subject: () => 'Planlagt sletning af dine data',
    heading: 'Planlagt sletning',
    hi: (n) => `Hej ${n},`,
    account: (d) => `Din konto på ${SITE_NAME} har været inaktiv i næsten 12 måneder. Efter vores slettefrister slettes den den ${d} sammen med dine trænings- og helbredsdata.`,
    video: (t, d) => `Videooptagelsen "${t}" når vores grænse på 24 måneder og slettes den ${d} — inklusive tags, noter og tegninger.`,
    club: (c, d) => `Licensen for ${c} er ophørt. Efter vores slettefrister slettes klubbens atletdata den ${d}. Eksportér det, du skal bruge, inden da.`,
    keep: 'Log blot ind inden da, hvis du vil beholde dine data — et login nulstiller fristen.',
    footer: 'Dette er en automatisk besked om opbevaringsfrister.',
  },
  sv: {
    dir: 'ltr',
    subject: () => 'Planerad radering av dina uppgifter',
    heading: 'Planerad radering',
    hi: (n) => `Hej ${n},`,
    account: (d) => `Ditt konto på ${SITE_NAME} har varit inaktivt i nästan 12 månader. Enligt våra lagringstider raderas det den ${d} tillsammans med dina tränings- och hälsouppgifter.`,
    video: (t, d) => `Videoinspelningen "${t}" når vår gräns på 24 månader och raderas den ${d} — inklusive taggar, anteckningar och ritningar.`,
    club: (c, d) => `Licensen för ${c} har upphört. Enligt våra lagringstider raderas klubbens atletuppgifter den ${d}. Exportera det du behöver innan dess.`,
    keep: 'Logga bara in innan dess om du vill behålla uppgifterna — en inloggning nollställer fristen.',
    footer: 'Detta är ett automatiskt meddelande om lagringstider.',
  },
  de: {
    dir: 'ltr',
    subject: () => 'Geplante Löschung Ihrer Daten',
    heading: 'Geplante Löschung',
    hi: (n) => `Hallo ${n},`,
    account: (d) => `Ihr Konto bei ${SITE_NAME} ist seit fast 12 Monaten inaktiv. Nach unseren Löschfristen wird es am ${d} zusammen mit Ihren Trainings- und Gesundheitsdaten gelöscht.`,
    video: (t, d) => `Die Videoaufnahme „${t}" erreicht unsere Grenze von 24 Monaten und wird am ${d} gelöscht — einschließlich Tags, Notizen und Zeichnungen.`,
    club: (c, d) => `Die Lizenz für ${c} ist beendet. Nach unseren Löschfristen werden die Athletendaten des Vereins am ${d} gelöscht. Exportieren Sie vorher, was Sie benötigen.`,
    keep: 'Melden Sie sich einfach vorher an, wenn Sie die Daten behalten möchten — eine Anmeldung setzt die Frist zurück.',
    footer: 'Dies ist eine automatische Nachricht zu Aufbewahrungsfristen.',
  },
  ar: {
    dir: 'rtl',
    subject: () => 'حذف مُجدوَل لبياناتك',
    heading: 'حذف مُجدوَل',
    hi: (n) => `مرحبًا ${n}،`,
    account: (d) => `ظل حسابك على ${SITE_NAME} غير نشط لما يقارب 12 شهرًا. وفقًا لمدد الاحتفاظ لدينا سيُحذف في ${d} مع بيانات تدريبك وبياناتك الصحية.`,
    video: (t, d) => `التسجيل المصوّر "${t}" بلغ حد الاحتفاظ البالغ 24 شهرًا وسيُحذف في ${d}، بما في ذلك الوسوم والملاحظات والرسومات.`,
    club: (c, d) => `انتهى ترخيص ${c}. وفقًا لمدد الاحتفاظ لدينا ستُحذف بيانات رياضيي النادي في ${d}. صدّر ما تحتاجه قبل ذلك التاريخ.`,
    keep: 'يكفي تسجيل الدخول قبل ذلك التاريخ إذا أردت الاحتفاظ بالبيانات — تسجيل الدخول يعيد ضبط المهلة.',
    footer: 'هذه رسالة تلقائية بشأن مدد الاحتفاظ بالبيانات.',
  },
  no: {
    dir: 'ltr',
    subject: () => 'Planlagt sletting av dataene dine',
    heading: 'Planlagt sletting',
    hi: (n) => `Hei ${n},`,
    account: (d) => `Kontoen din på ${SITE_NAME} har vært inaktiv i nesten 12 måneder. Etter våre slettefrister slettes den ${d} sammen med trenings- og helsedataene dine.`,
    video: (t, d) => `Videoopptaket "${t}" når grensen vår på 24 måneder og slettes ${d} — inkludert tagger, notater og tegninger.`,
    club: (c, d) => `Lisensen for ${c} er avsluttet. Etter våre slettefrister slettes klubbens utøverdata ${d}. Eksportér det du trenger før den datoen.`,
    keep: 'Logg bare inn før den datoen hvis du vil beholde dataene — en innlogging nullstiller fristen.',
    footer: 'Dette er en automatisk melding om lagringsfrister.',
  },
  es: {
    dir: 'ltr',
    subject: () => 'Eliminación programada de sus datos',
    heading: 'Eliminación programada',
    hi: (n) => `Hola ${n}:`,
    account: (d) => `Su cuenta en ${SITE_NAME} lleva casi 12 meses inactiva. Según nuestros plazos de conservación se eliminará el ${d}, junto con sus datos de entrenamiento y de salud.`,
    video: (t, d) => `La grabación de vídeo "${t}" alcanza nuestro límite de 24 meses y se eliminará el ${d}, incluidas las etiquetas, las notas y los dibujos.`,
    club: (c, d) => `La licencia de ${c} ha finalizado. Según nuestros plazos de conservación, los datos de los deportistas del club se eliminarán el ${d}. Exporte lo que necesite antes de esa fecha.`,
    keep: 'Basta con iniciar sesión antes de esa fecha si desea conservar los datos: el inicio de sesión reinicia el plazo.',
    footer: 'Este es un mensaje automático sobre los plazos de conservación.',
  },
}

const RetentionDeletionWarningEmail = ({
  kind = 'account',
  recipientName = '',
  subjectLabel = '',
  deleteOn = '',
  locale = 'da',
}: Props) => {
  const c = COPY[locale] ?? COPY.da
  const bodyText =
    kind === 'video' ? c.video(subjectLabel, deleteOn)
    : kind === 'club' ? c.club(subjectLabel, deleteOn)
    : c.account(deleteOn)

  return (
    <Html lang={locale} dir={c.dir}>
      <Head />
      <Preview>{c.heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={h1}>{c.heading}</Heading>
          </Section>
          <Text style={text}>{c.hi(recipientName || SITE_NAME)}</Text>
          <Text style={text}>{bodyText}</Text>
          {kind === 'account' && <Text style={text}>{c.keep}</Text>}
          <Text style={footer}>{c.footer} — {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RetentionDeletionWarningEmail,
  subject: (d: Record<string, any>) => {
    const c = COPY[(d.locale as Locale)] ?? COPY.da
    return c.subject(d.kind ?? 'account')
  },
  displayName: 'Retention deletion warning',
  previewData: {
    kind: 'account',
    recipientName: 'Sara',
    deleteOn: '2026-11-01',
    locale: 'da',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '24px' }
