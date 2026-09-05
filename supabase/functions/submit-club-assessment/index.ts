import { createClient } from 'npm:@supabase/supabase-js@2'
import { signToken, verifyToken } from '../_shared/assessment-token.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`club-assessment:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  // Honeypot — silently pretend success for bots
  if (body.website && String(body.website).trim().length > 0) {
    return json({ success: true, id: null })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const action = String(body.action || 'submit')

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  const clientIpHash = await hashIp(clientIp)
  const tokenSecret = Deno.env.get('ASSESSMENT_TOKEN_SECRET')

  // ---- Profile update on an existing (just created) assessment ----
  // Kræver en kortlivet, signeret token udstedt ved selve indsendelsen.
  if (action === 'profile') {
    if (!tokenSecret) return json({ error: 'not_configured' }, 500)

    // Samme IP-rate limit som på indsendelsen: max 5 i timen.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: attempts } = await admin
      .from('club_assessment_profile_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', clientIpHash)
      .gte('created_at', hourAgo)
    if ((attempts ?? 0) >= 5) return json({ error: 'rate_limited' }, 429)
    await admin.from('club_assessment_profile_attempts').insert({ ip_hash: clientIpHash })

    const providedToken = String(body.token || '').trim()
    const verified = await verifyToken(tokenSecret, 'profile', providedToken)
    if (!verified.ok) {
      return json({ error: verified.reason === 'expired' ? 'token_expired' : 'invalid_token' }, 403)
    }

    const id = verified.id
    const clubName = body.club_name ? String(body.club_name).slice(0, 120) : null
    const sport = body.sport ? String(body.sport).slice(0, 80) : null
    const role = body.role ? String(body.role).slice(0, 60) : null
    const memberRange = body.member_range ? String(body.member_range).slice(0, 20) : null
    const coachRange = body.coach_range ? String(body.coach_range).slice(0, 20) : null

    // Engangsbrug: kun rækker der ikke allerede har fået profildata.
    const { data: updated, error } = await admin
      .from('club_assessments')
      .update({
        club_name: clubName,
        sport,
        role,
        member_range: memberRange,
        coach_range: coachRange,
        profile_completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('profile_completed_at', null)
      .select('id, email, level, scores')

    if (error) return json({ error: 'update_failed' }, 500)
    if (!updated || updated.length === 0) return json({ error: 'token_used' }, 403)

    // Admin-notifikation med klubprofilen. Fejl logges og sluges.
    try {
      const row: any = updated[0]
      await sendTemplateEmail('club-assessment-notification', '', {
        templateData: {
          assessmentId: row.id,
          clubName,
          email: row.email,
          sport,
          role,
          level: row.level,
          scores: row.scores,
          isTest: String(row.email || '').endsWith('@sportstalent.dk'),
          adminUrl: `https://sportstalent.dk/admin/klubanalyser?id=${row.id}`,
        },
        idempotencyKey: `club-assessment-notification-profile-${row.id}`,
      })
    } catch (e) {
      console.error('club-assessment profile notification failed', e)
    }

    return json({ success: true })
  }


  // ---- New submission ----
  const email = String(body.email || '').trim().toLowerCase()
  const consent = body.consent === true
  const answers = body.answers
  const scores = body.scores
  const level = Number(body.level)
  const weakest = String(body.weakest || '').slice(0, 60)
  const strongest = String(body.strongest || '').slice(0, 60)
  const locale = String(body.locale || 'da').toLowerCase() === 'en' ? 'en' : 'da'

  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'invalid_email' }, 400)
  if (!consent) return json({ error: 'consent_required' }, 400)
  if (!Array.isArray(answers) || answers.length !== 15 ||
      answers.some((a: unknown) => !Number.isInteger(a) || (a as number) < 0 || (a as number) > 3)) {
    return json({ error: 'invalid_answers' }, 400)
  }
  if (!Array.isArray(scores) || scores.length !== 5 ||
      scores.some((s: unknown) => !Number.isInteger(s) || (s as number) < 0 || (s as number) > 9)) {
    return json({ error: 'invalid_scores' }, 400)
  }
  if (!Number.isInteger(level) || level < 1 || level > 5) return json({ error: 'invalid_level' }, 400)

  const ipHash = clientIpHash

  // Simple rate limit: max 5 submissions per IP per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('club_assessments')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo)

  if ((count ?? 0) >= 5) return json({ error: 'rate_limited' }, 429)

  const { data, error } = await admin
    .from('club_assessments')
    .insert({
      email,
      consent,
      answers,
      scores,
      level,
      weakest,
      strongest,
      locale,
      ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (error) return json({ error: 'insert_failed' }, 500)

  // Kortlivet (30 min), engangsbrug-token bundet til den oprettede række.
  // Klienten holder den kun i hukommelsen — aldrig i URL eller localStorage.
  let profileToken: string | null = null
  if (tokenSecret) {
    profileToken = await signToken(tokenSecret, 'profile', data.id, 30 * 60)
  }

  // Rapportmail — må ALDRIG få indsendelsen til at fejle.
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-assessment-report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: data.id }),
    })
    if (!res.ok) {
      console.error(`send-assessment-report returned ${res.status}: ${await res.text()}`)
    }
  } catch (e) {
    console.error('send-assessment-report invocation failed', e)
  }

  // Admin-notifikation — helt uafhængig af respondentens rapportmail.
  // Fejl logges og sluges; må aldrig påvirke svaret til klienten.
  try {
    const isTest = email.endsWith('@sportstalent.dk')
    await sendTemplateEmail('club-assessment-notification', '', {
      templateData: {
        assessmentId: data.id,
        clubName: null,
        email,
        sport: null,
        role: null,
        level,
        scores,
        isTest,
        adminUrl: `https://sportstalent.dk/admin/klubanalyser?id=${data.id}`,
      },
      idempotencyKey: `club-assessment-notification-${data.id}`,
    })
  } catch (e) {
    console.error('club-assessment admin notification failed', e)
  }

  return json({ success: true, id: data.id, token: profileToken })
})

