import { createClient } from 'npm:@supabase/supabase-js@2'
import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.0'
import {
  DIMENSION_CONTENT,
  LEVEL_CONTENT,
  DIMENSION_CONTENT_EN,
  LEVEL_CONTENT_EN,
} from '../_shared/club-assessment-content.ts'
import { signToken } from '../_shared/assessment-token.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SITE = 'https://sportstalent.dk'
const REPLY_TO = 'farooq@sportstalent.dk'
const SENDER_DOMAIN = 'notify.sportstalent.dk'
const COMPANY = 'Sportstalent · Farooq Rashid · Danmark'

const GOLD = '#C9A227'
const INK = '#0A0A0A'
const BG = '#F4F4F2'
const CARD = '#FFFFFF'
const MUTED = '#55565A'
const TRACK = '#E8E8E6'
const WEAK = '#C0392B'
const STRONG = '#2A9D8F'
const NEUTRAL = '#9AA0A6'

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

type Loc = 'da' | 'en'

const SUBJECTS: Record<Loc, ((level: number, weakest: string) => string)[]> = {
  da: [
    (level, weakest) => `Jeres klubanalyse: niveau ${level}, bremset af ${weakest}`,
    (_level, weakest) => `${weakest} sætter loftet for jeres talentarbejde`,
    (level) => `Niveau ${level} — og de tre skridt i den rigtige rækkefølge`,
  ],
  en: [
    (level, weakest) => `Your club assessment: level ${level}, held back by ${weakest}`,
    (_level, weakest) => `${weakest} sets the ceiling for your talent work`,
    (level) => `Level ${level} — and the three steps in the right order`,
  ],
}

const DAY_LABELS: Record<Loc, string[]> = {
  da: ['Dag 1-30', 'Dag 31-60', 'Dag 61-90'],
  en: ['Day 1-30', 'Day 31-60', 'Day 61-90'],
}

const T = {
  da: {
    htmlLang: 'da',
    docTitle: 'Jeres klubanalyse',
    brand: 'Sportstalent · Klubanalysen',
    clubFallback: 'Jeres klub',
    roleFallback: 'En fra klubben',
    preheader: (w: string) =>
      `${w} sætter loftet for jeres talentarbejde — her er de tre skridt i den rækkefølge, de skal tages.`,
    heldBackBy: (club: string, w: string) => `${club} er bremset af ${w}`,
    intro: (role: string) =>
      `${role} har gennemført Klubanalysen: 15 spørgsmål om rød tråd, trænerkapacitet, data, kultur og ledelse. Niveauet sættes af det svageste af de fem områder — ikke af gennemsnittet. En klub er ikke halvvejs, fordi den er stærk ét sted og fraværende et andet. Den er sårbar.`,
    distribution: 'Fordeling',
    levelWord: 'Niveau',
    stepsTitle: 'De tre skridt — i den rækkefølge, de skal tages',
    stepsIntro:
      'Rækkefølgen er ikke ligegyldig. Tager I det næststørste hul først, bygger I oven på det største — og så holder arbejdet kun, indtil den næste udskiftning.',
    doFirst: 'Gør det her først:',
    boardKicker: 'Tag med til næste bestyrelsesmøde',
    closing:
      'De tre skridt kræver ingen software. De kræver, at nogen har tid — og at det, der bliver skrevet, stadig findes om to år. Det er dér, de fleste klubber løber tør.',
    cta: 'Book en gennemgang af jeres tre huller',
    ctaNote:
      '30 minutter, ingen forpligtelser. Vi gennemgår jeres tre huller — også hvis I ender med at løse dem selv.',
    footerReason: (d: string) =>
      `Du modtager denne mail, fordi der blev gennemført en klubanalyse på sportstalent.dk den ${d} med denne adresse.`,
    unsubscribe: 'Afmeld',
    privacy: 'Privatlivspolitik',
    dateLocale: 'da-DK',
  },
  en: {
    htmlLang: 'en',
    docTitle: 'Your club assessment',
    brand: 'Sportstalent · Club Assessment',
    clubFallback: 'Your club',
    roleFallback: 'Someone from the club',
    preheader: (w: string) =>
      `${w} sets the ceiling for your talent work — here are the three steps in the order they should be taken.`,
    heldBackBy: (club: string, w: string) => `${club} is held back by ${w}`,
    intro: (role: string) =>
      `${role} completed the Club Assessment: 15 questions on common thread, coaching capacity, data, culture and leadership. The level is set by the weakest of the five areas — not by the average. A club is not halfway there because it is strong in one place and absent in another. It is vulnerable.`,
    distribution: 'Distribution',
    levelWord: 'Level',
    stepsTitle: 'The three steps — in the order they should be taken',
    stepsIntro:
      'The order matters. If you take the second-biggest gap first, you build on top of the biggest one — and the work only holds until the next change of staff.',
    doFirst: 'Do this first:',
    boardKicker: 'Bring this to your next board meeting',
    closing:
      'The three steps require no software. They require someone to have the time — and for what gets written down to still exist in two years. That is where most clubs run out.',
    cta: 'Book a review of your three gaps',
    ctaNote:
      '30 minutes, no obligation. We go through your three gaps — even if you end up solving them yourselves.',
    footerReason: (d: string) =>
      `You are receiving this email because a club assessment was completed on sportstalent.dk on ${d} using this address.`,
    unsubscribe: 'Unsubscribe',
    privacy: 'Privacy policy',
    dateLocale: 'en-GB',
  },
} as const

function fmtDate(iso: string, loc: Loc = 'da'): string {
  try {
    return new Intl.DateTimeFormat(T[loc].dateLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Copenhagen',
    }).format(new Date(iso))
  } catch {
    return new Date(iso).toISOString().slice(0, 10)
  }
}

type Row = {
  id: string
  email: string
  level: number
  scores: number[]
  weakest: string
  strongest: string
  club_name: string | null
  role: string | null
  created_at: string
  locale?: string | null
}

function buildHtml(row: Row, unsubUrl: string, loc: Loc) {
  const t = T[loc]
  const scores = row.scores || [0, 0, 0, 0, 0]
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const weakestIdx = scores.indexOf(min)
  const strongestIdx = scores.indexOf(max)
  const dims = loc === 'en' ? DIMENSION_CONTENT_EN : DIMENSION_CONTENT
  const weakestName = dims[weakestIdx]?.name ?? row.weakest
  const level = Math.min(5, Math.max(1, row.level || 1))
  const lvl = (loc === 'en' ? LEVEL_CONTENT_EN : LEVEL_CONTENT)[level - 1]
  const clubName = row.club_name?.trim() || t.clubFallback
  const roleName = row.role?.trim() || t.roleFallback
  const lowestThree = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, 3)

  const preheader = t.preheader(weakestName)

  const bar = (i: number) => {
    const pct = Math.max(2, Math.round((scores[i] / 9) * 100))
    const color = i === weakestIdx ? WEAK : i === strongestIdx && strongestIdx !== weakestIdx ? STRONG : NEUTRAL
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr>
      <td width="${pct}%" style="background-color:${color};height:8px;line-height:8px;font-size:0;border-radius:4px 0 0 4px;">&nbsp;</td>
      <td width="${100 - pct}%" style="background-color:${TRACK};height:8px;line-height:8px;font-size:0;border-radius:0 4px 4px 0;">&nbsp;</td>
    </tr></table>`
  }

  const levelOf = (s: number) => (s <= 1 ? 1 : s <= 3 ? 2 : s <= 5 ? 3 : s <= 7 ? 4 : 5)

  const distributionRows = dims
    .map(
      (d, i) => `<tr><td style="padding:0 0 14px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td style="font:700 14px Arial,Helvetica,sans-serif;color:${INK};padding-bottom:6px;">${esc(d.name)}</td>
          <td align="right" style="font:700 13px Arial,Helvetica,sans-serif;color:${MUTED};padding-bottom:6px;">${t.levelWord} ${levelOf(scores[i])}</td>
        </tr></table>
        ${bar(i)}
      </td></tr>`,
    )
    .join('')

  const stepCards = lowestThree
    .map(({ i }, n) => {
      const d = dims[i]
      return `<tr><td style="padding:0 0 14px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG};border-radius:10px;">
          <tr><td style="padding:18px 20px;">
            <div style="font:800 11px Arial,Helvetica,sans-serif;letter-spacing:1.2px;color:${GOLD};text-transform:uppercase;">${DAY_LABELS[loc][n]}</div>
            <div style="font:800 17px Arial,Helvetica,sans-serif;color:${INK};padding:6px 0 10px;">${esc(d.name)}</div>
            <div style="font:400 15px/1.65 Arial,Helvetica,sans-serif;color:${MUTED};padding-bottom:12px;">${esc(d.consequence)}</div>
            <div style="font:400 15px/1.65 Arial,Helvetica,sans-serif;color:${INK};"><strong>${t.doFirst}</strong> ${esc(d.firstStep)}</div>
          </td></tr>
        </table>
      </td></tr>`
    })
    .join('')

  const boardQuestion = dims[weakestIdx]?.boardQuestion ?? dims[0].boardQuestion

  return `<!DOCTYPE html>
<html lang="${t.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.docTitle)}</title></head>
<body style="margin:0;padding:0;background-color:${BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG};">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;">

  <!-- 1. Header -->
  <tr><td style="background-color:${INK};border-radius:12px 12px 0 0;padding:20px 28px;">
    <div style="font:800 12px Arial,Helvetica,sans-serif;letter-spacing:2px;color:${GOLD};text-transform:uppercase;">${esc(t.brand)}</div>
  </td></tr>

  <tr><td style="background-color:${CARD};padding:30px 28px 8px;">
    <!-- 2. Resultat -->
    <div style="font:900 64px/1 Arial,Helvetica,sans-serif;color:${INK};">${level}</div>
    <div style="font:800 24px Arial,Helvetica,sans-serif;color:${INK};padding:10px 0 2px;">${esc(lvl.name)}</div>
    <div style="font:400 14px Arial,Helvetica,sans-serif;color:${MUTED};">${esc(lvl.subtitle)}</div>

    <!-- 3. Overskrift -->
    <div style="font:800 22px/1.3 Arial,Helvetica,sans-serif;color:${INK};padding:26px 0 14px;">${esc(t.heldBackBy(clubName, weakestName))}</div>

    <!-- 4. Forklaring -->
    <div style="font:400 15px/1.7 Arial,Helvetica,sans-serif;color:${MUTED};padding-bottom:14px;">
      ${esc(t.intro(roleName))}
    </div>
    <div style="font:400 15px/1.7 Arial,Helvetica,sans-serif;color:${INK};padding-bottom:24px;">${esc(lvl.verdict)}</div>

    <!-- 5. Fordeling -->
    <div style="font:800 12px Arial,Helvetica,sans-serif;letter-spacing:1.4px;color:${MUTED};text-transform:uppercase;padding-bottom:14px;">${esc(t.distribution)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${distributionRows}</table>

    <!-- 6. De tre skridt -->
    <div style="font:800 22px/1.3 Arial,Helvetica,sans-serif;color:${INK};padding:18px 0 12px;">${esc(t.stepsTitle)}</div>
    <div style="font:400 15px/1.7 Arial,Helvetica,sans-serif;color:${MUTED};padding-bottom:18px;">
      ${esc(t.stepsIntro)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${stepCards}</table>

    <!-- 7. Bestyrelsesmøde -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${INK};border-radius:10px;margin:14px 0 8px;">
      <tr><td style="padding:22px 24px;">
        <div style="font:800 11px Arial,Helvetica,sans-serif;letter-spacing:1.6px;color:${GOLD};text-transform:uppercase;">${esc(t.boardKicker)}</div>
        <div style="font:700 18px/1.5 Arial,Helvetica,sans-serif;color:#FFFFFF;padding-top:12px;">${esc(boardQuestion)}</div>
      </td></tr>
    </table>

    <!-- 8. Afslutning + CTA -->
    <div style="font:400 15px/1.7 Arial,Helvetica,sans-serif;color:${MUTED};padding:22px 0 18px;">
      ${esc(t.closing)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background-color:${GOLD};border-radius:8px;">
        <a href="${SITE}/contact" style="display:inline-block;padding:14px 26px;font:800 15px Arial,Helvetica,sans-serif;color:${INK};text-decoration:none;">${esc(t.cta)}</a>
      </td>
    </tr></table>
    <div style="font:400 13px/1.6 Arial,Helvetica,sans-serif;color:${MUTED};padding:12px 0 30px;">
      ${esc(t.ctaNote)}
    </div>
  </td></tr>

  <!-- 9. Footer -->
  <tr><td style="background-color:${CARD};border-radius:0 0 12px 12px;border-top:1px solid ${TRACK};padding:20px 28px 26px;">
    <div style="font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#8A8B8F;">
      ${esc(t.footerReason(fmtDate(row.created_at, loc)))}<br>
      ${esc(COMPANY)}<br>
      <a href="${unsubUrl}" style="color:#8A8B8F;">${esc(t.unsubscribe)}</a> ·
      <a href="${SITE}/privacy" style="color:#8A8B8F;">${esc(t.privacy)}</a>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`
}

function buildText(row: Row, unsubUrl: string, loc: Loc) {
  const t = T[loc]
  const scores = row.scores || [0, 0, 0, 0, 0]
  const weakestIdx = scores.indexOf(Math.min(...scores))
  const dims = loc === 'en' ? DIMENSION_CONTENT_EN : DIMENSION_CONTENT
  const level = Math.min(5, Math.max(1, row.level || 1))
  const lvl = (loc === 'en' ? LEVEL_CONTENT_EN : LEVEL_CONTENT)[level - 1]
  const clubName = row.club_name?.trim() || t.clubFallback
  const roleName = row.role?.trim() || t.roleFallback
  const lowestThree = scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, 3)

  const steps = lowestThree
    .map(({ i }, n) => {
      const d = dims[i]
      return `${DAY_LABELS[loc][n]} — ${d.name}\n${d.consequence}\n${t.doFirst} ${d.firstStep}`
    })
    .join('\n\n')

  return `${t.brand.toUpperCase()}

${t.levelWord} ${level} — ${lvl.name} (${lvl.subtitle})

${t.heldBackBy(clubName, dims[weakestIdx]?.name ?? row.weakest)}

${t.intro(roleName)}

${lvl.verdict}

${t.distribution.toUpperCase()}
${dims.map((d, i) => `- ${d.name}: ${scores[i]}/9`).join('\n')}

${t.stepsTitle.toUpperCase()}
${t.stepsIntro}

${steps}

${t.boardKicker.toUpperCase()}
${dims[weakestIdx]?.boardQuestion ?? dims[0].boardQuestion}

${t.closing}

${t.cta}: ${SITE}/contact
${t.ctaNote}

---
${t.footerReason(fmtDate(row.created_at, loc))}
${COMPANY}
${t.unsubscribe}: ${unsubUrl}
${t.privacy}: ${SITE}/privacy`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!

  // Kun betroede server-kaldere (service role) må sende rapporter.
  const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!bearer || bearer !== serviceKey) return json({ error: 'unauthorized' }, 401)

  // FEATURE FLAG — slået fra ved deploy. Sæt ASSESSMENT_REPORT_ENABLED=true
  // i Project Settings → Secrets, når SPF/DKIM/DMARC er verificeret.
  const enabled = (Deno.env.get('ASSESSMENT_REPORT_ENABLED') || '').toLowerCase() === 'true'
  if (!enabled) {
    console.log('send-assessment-report: feature flag disabled, skipping send')
    return json({ success: false, reason: 'disabled' })
  }

  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  const tokenSecret = Deno.env.get('ASSESSMENT_TOKEN_SECRET')
  if (!lovableApiKey || !tokenSecret) {
    console.error('send-assessment-report: missing LOVABLE_API_KEY or ASSESSMENT_TOKEN_SECRET')
    return json({ error: 'not_configured' }, 500)
  }

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const id = String(body.id || '').trim()
  if (!id) return json({ error: 'missing_id' }, 400)

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: row, error } = await admin
    .from('club_assessments')
    .select('id,email,level,scores,weakest,strongest,club_name,role,created_at,report_sent_at,unsubscribed_at,locale')
    .eq('id', id)
    .maybeSingle()

  if (error || !row) return json({ error: 'not_found' }, 404)
  if (row.report_sent_at) return json({ success: false, reason: 'already_sent' })
  if (row.unsubscribed_at) return json({ success: false, reason: 'unsubscribed' })

  const unsubToken = await signToken(tokenSecret, 'unsub', row.id, 0)
  const unsubUrl = `${supabaseUrl}/functions/v1/assessment-unsubscribe?token=${encodeURIComponent(unsubToken)}`

  // A/B-test: lige fordeling på tre emnelinjer
  const loc: Loc = String((row as Row).locale || 'da').toLowerCase() === 'en' ? 'en' : 'da'
  const dimsForSubject = loc === 'en' ? DIMENSION_CONTENT_EN : DIMENSION_CONTENT
  const variantIdx = Math.floor(Math.random() * SUBJECTS[loc].length)
  const weakestName =
    dimsForSubject[(row.scores as number[]).indexOf(Math.min(...(row.scores as number[])))]?.name ||
    row.weakest
  const subject = SUBJECTS[loc][variantIdx](row.level, weakestName)
  const variantLabel = String.fromCharCode(65 + variantIdx) // A / B / C

  const html = buildHtml(row as Row, unsubUrl, loc)
  const text = buildText(row as Row, unsubUrl, loc)

  try {
    await sendLovableEmail(
      {
        to: row.email,
        from: 'Sportstalent <noreply@sportstalent.dk>',
        sender_domain: SENDER_DOMAIN,
        reply_to: REPLY_TO,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: 'club-assessment-report',
        idempotency_key: `club-assessment-report-${row.id}`,
      },
      { apiKey: lovableApiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') },
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      console.warn('send-assessment-report: recipient suppressed', { id: row.id })
      return json({ success: false, reason: 'recipient_suppressed' })
    }
    const code = error instanceof EmailAPIError ? error.code : 'unknown'
    console.error('send-assessment-report: managed send failed', { id: row.id, code, error })
    return json({ error: 'send_failed', code }, 500)
  }

  await admin
    .from('club_assessments')
    .update({ report_sent_at: new Date().toISOString(), subject_variant: variantLabel })
    .eq('id', row.id)

  console.log('send-assessment-report: sent', { id: row.id, variant: variantLabel })
  return json({ success: true, variant: variantLabel })
})
