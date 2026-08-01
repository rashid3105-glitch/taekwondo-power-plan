import { createClient } from 'npm:@supabase/supabase-js@2'

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

  // ---- Profile update on an existing (just created) assessment ----
  if (action === 'profile') {
    const id = String(body.id || '').trim()
    if (!id) return json({ error: 'missing_id' }, 400)
    const clubName = body.club_name ? String(body.club_name).slice(0, 120) : null
    const sport = body.sport ? String(body.sport).slice(0, 80) : null
    const role = body.role ? String(body.role).slice(0, 60) : null

    const { error } = await admin
      .from('club_assessments')
      .update({
        club_name: clubName,
        sport,
        role,
        profile_completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('profile_completed_at', null)

    if (error) return json({ error: 'update_failed' }, 500)
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

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  const ipHash = await hashIp(ip)

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
      ip_hash: ipHash,
    })
    .select('id')
    .single()

  if (error) return json({ error: 'insert_failed' }, 500)
  return json({ success: true, id: data.id })
})
