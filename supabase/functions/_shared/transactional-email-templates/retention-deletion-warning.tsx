import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

type Locale = 'en' | 'da' | 'sv' | 'de' | 'ar' | 'no' | 'es'

interface Props {
  /** 'account' | 'video' | 'club' | 'health_data' | 'club_athlete' */
  kind?: string
  recipientName?: string
  /** Title of the video, or name of the club — empty for accounts. */
  subjectLabel?: string
  /** ISO date the deletion happens. */
  deleteOn?: string
  locale?: Locale
}

// Export always requires a sign-in; never a tokenised anonymous download link.
const loginUrl = 'https://sportstalent.dk/auth?tab=signin'

const COPY: Record<Locale, {
  dir: 'ltr' | 'rtl'
  subject: (k: string) => string
  heading: string
  hi: (n: string) => string
  account: (d: string) => string
  video: (t: string, d: string) => string
  club: (c: string, d: string) => string
  health: (d: string) => string
  exportCta: string
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
    health: (d) => `Your club membership has ended. On ${d} your health data (wearables, readiness, weight, mood/energy, mental assessments, reflections) and the club's data about you (coach comments, club plans and assignments, attendance and team memberships) will be deleted. Your account is kept — including your own diary text, test results and personal plans — so you can join a new club.`,
    clubAthlete: (c, d) => `The licence for ${c} has ended. On ${d} the club's data about you will be deleted: coach comments, club plans and assignments, attendance and team memberships. Your health data (wearables, readiness, weight, mood/energy, mental assessments) will also be deleted, unless you are active in another club. Your account is kept — including your own diary text, test results and personal plans — so you can join a new club.`,
    exportCta: 'Sign in to download your data before that date — the export requires your login, so no one else can access it:',
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
    health: (d) => `Dit klubmedlemskab er afsluttet. Den ${d} slettes dine helbredsdata (wearables, readiness, vægt, humør/energi, mentale vurderinger, refleksioner) og klubbens data om dig (trænerkommentarer, klubbens planer og tildelinger, fremmøde og holdmedlemskaber). Din konto bevares — også din egen dagbogstekst, dine testresultater og personlige planer — så du kan meldes ind i en ny klub.`,
    clubAthlete: (c, d) => `Licensen for ${c} er ophørt. Den ${d} slettes klubbens data om dig: trænerkommentarer, klubbens planer og tildelinger, fremmøde og holdmedlemskaber. Dine helbredsdata (wearables, readiness, vægt, humør/energi, mentale vurderinger) slettes også, medmindre du er aktiv i en anden klub. Din konto bevares — også din egen dagbogstekst, dine testresultater og personlige planer — så du kan meldes ind i en ny klub.`,
    exportCta: 'Log ind og hent dine data inden da — eksporten kræver dit login, så ingen andre kan hente dem:',
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
    health: (d) => `Ditt klubbmedlemskap har avslutats. Den ${d} raderas dina hälsouppgifter (wearables, readiness, vikt, humör/energi, mentala bedömningar, reflektioner) och klubbens uppgifter om dig (tränarkommentarer, klubbens planer och tilldelningar, närvaro och lagmedlemskap). Ditt konto behålls — även din egen dagbokstext, dina testresultat och personliga planer — så att du kan gå med i en ny klubb.`,
    clubAthlete: (c, d) => `Licensen för ${c} har upphört. Den ${d} raderas klubbens uppgifter om dig: tränarkommentarer, klubbens planer och tilldelningar, närvaro och lagmedlemskap. Dina hälsouppgifter (wearables, readiness, vikt, humör/energi, mentala bedömningar) raderas också, om du inte är aktiv i en annan klubb. Ditt konto behålls — även din egen dagbokstext, dina testresultat och personliga planer — så att du kan gå med i en ny klubb.`,
    exportCta: 'Logga in och hämta dina uppgifter innan dess — exporten kräver din inloggning, så ingen annan kommer åt dem:',
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
    health: (d) => `Ihre Vereinsmitgliedschaft ist beendet. Am ${d} werden Ihre Gesundheitsdaten (Wearables, Readiness, Gewicht, Stimmung/Energie, mentale Bewertungen, Reflexionen) und die Daten des Vereins über Sie (Trainerkommentare, Vereinspläne und Zuweisungen, Anwesenheit und Teammitgliedschaften) gelöscht. Ihr Konto bleibt bestehen — einschließlich Ihres eigenen Tagebuchtexts, Ihrer Testergebnisse und persönlichen Pläne —, sodass Sie einem neuen Verein beitreten können.`,
    clubAthlete: (c, d) => `Die Lizenz für ${c} ist beendet. Am ${d} werden die Daten des Vereins über Sie gelöscht: Trainerkommentare, Vereinspläne und Zuweisungen, Anwesenheit und Teammitgliedschaften. Ihre Gesundheitsdaten (Wearables, Readiness, Gewicht, Stimmung/Energie, mentale Bewertungen) werden ebenfalls gelöscht, sofern Sie nicht in einem anderen Verein aktiv sind. Ihr Konto bleibt bestehen — einschließlich Ihres eigenen Tagebuchtexts, Ihrer Testergebnisse und persönlichen Pläne —, sodass Sie einem neuen Verein beitreten können.`,
    exportCta: 'Melden Sie sich vorher an und laden Sie Ihre Daten herunter — der Export erfordert Ihre Anmeldung, sodass niemand sonst darauf zugreifen kann:',
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
    health: (d) => `انتهت عضويتك في النادي. في ${d} ستُحذف بياناتك الصحية (الأجهزة القابلة للارتداء والجاهزية والوزن والمزاج/الطاقة والتقييمات الذهنية والتأملات) وبيانات النادي عنك (تعليقات المدربين وخطط النادي والتكليفات والحضور وعضويات الفرق). يبقى حسابك — بما في ذلك نص مذكراتك ونتائج اختباراتك وخططك الشخصية — لتتمكن من الانضمام إلى نادٍ جديد.`,
    clubAthlete: (c, d) => `انتهى ترخيص ${c}. في ${d} ستُحذف بيانات النادي عنك: تعليقات المدربين وخطط النادي والتكليفات والحضور وعضويات الفرق. كما ستُحذف بياناتك الصحية (الأجهزة القابلة للارتداء والجاهزية والوزن والمزاج/الطاقة والتقييمات الذهنية) ما لم تكن نشطًا في نادٍ آخر. يبقى حسابك — بما في ذلك نص مذكراتك ونتائج اختباراتك وخططك الشخصية — لتتمكن من الانضمام إلى نادٍ جديد.`,
    exportCta: 'سجّل الدخول ونزّل بياناتك قبل ذلك التاريخ — يتطلب التصدير تسجيل دخولك، فلا يمكن لأحد غيرك الوصول إليها:',
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
    health: (d) => `Klubbmedlemskapet ditt er avsluttet. ${d} slettes helsedataene dine (wearables, readiness, vekt, humør/energi, mentale vurderinger, refleksjoner) og klubbens data om deg (trenerkommentarer, klubbens planer og tildelinger, oppmøte og lagmedlemskap). Kontoen din beholdes — også din egen dagboktekst, testresultater og personlige planer — slik at du kan meldes inn i en ny klubb.`,
    clubAthlete: (c, d) => `Lisensen for ${c} er avsluttet. ${d} slettes klubbens data om deg: trenerkommentarer, klubbens planer og tildelinger, oppmøte og lagmedlemskap. Helsedataene dine (wearables, readiness, vekt, humør/energi, mentale vurderinger) slettes også, med mindre du er aktiv i en annen klubb. Kontoen din beholdes — også din egen dagboktekst, testresultater og personlige planer — slik at du kan meldes inn i en ny klubb.`,
    exportCta: 'Logg inn og last ned dataene dine før den datoen — eksporten krever innlogging, så ingen andre får tilgang:',
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
    health: (d) => `Su membresía del club ha finalizado. El ${d} se eliminarán sus datos de salud (wearables, readiness, peso, estado de ánimo/energía, evaluaciones mentales, reflexiones) y los datos del club sobre usted (comentarios de entrenadores, planes y asignaciones del club, asistencia y membresías de equipo). Su cuenta se conserva, incluido el texto de su diario, sus resultados de pruebas y sus planes personales, para que pueda unirse a un nuevo club.`,
    clubAthlete: (c, d) => `La licencia de ${c} ha finalizado. El ${d} se eliminarán los datos del club sobre usted: comentarios de entrenadores, planes y asignaciones del club, asistencia y membresías de equipo. Sus datos de salud (wearables, readiness, peso, estado de ánimo/energía, evaluaciones mentales) también se eliminarán, salvo que esté activo en otro club. Su cuenta se conserva, incluido el texto de su diario, sus resultados de pruebas y sus planes personales, para que pueda unirse a un nuevo club.`,
    exportCta: 'Inicie sesión y descargue sus datos antes de esa fecha: la exportación requiere su inicio de sesión, por lo que nadie más puede acceder a ellos:',
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
    kind === 'health_data' ? c.health(deleteOn)
    : kind === 'club_athlete' ? c.clubAthlete(subjectLabel, deleteOn)
    : kind === 'video' ? c.video(subjectLabel, deleteOn)
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
          {(kind === 'health_data' || kind === 'club_athlete') && (
            <>
              <Text style={text}>{c.exportCta}</Text>
              <Text style={text}><a href={loginUrl} style={link}>{loginUrl}</a></Text>
            </>
          )}
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
const link = { color: '#0369a1', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#9ca3af', marginTop: '24px' }
