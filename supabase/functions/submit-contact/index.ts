import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.25.76'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' }
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers })
const schema = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(255), message: z.string().trim().max(1000), offer: z.enum(['demo', 'trial', 'general']) }).refine(v => v.offer !== 'general' || v.message.length > 0)
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'invalid_input' }, 400)
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) return json({ error: 'configuration_error' }, 500)
    const admin = createClient(url, key)
    const { name, email, offer, message } = parsed.data
    const label = offer === 'demo' ? 'Demo' : offer === 'trial' ? 'Gratis prøvemåned' : 'Kontakt'
    // The existing database trigger enforces the shared public-form limits on this insert.
    const storedMessage = `[${label}]\n${message || 'Ønsker personlig kontakt om klubben.'}`
    const { data, error } = await admin.from('contact_submissions').insert({ name, email, message: storedMessage }).select('id').single()
    if (error || !data) return json({ error: error?.message.includes('rate_limited') ? 'rate_limited' : 'save_failed' }, error?.message.includes('rate_limited') ? 429 : 500)
    let notified = false
    try {
      const result = await sendTemplateEmail('contact-owner-notification', '', { templateData: { name, email, message: storedMessage }, idempotencyKey: `contact-owner-${data.id}`, replyTo: email })
      notified = result.sent
    } catch (error) {
      console.error('Contact notification failed', { submissionId: data.id, error: error instanceof Error ? error.message : 'unknown' })
    }
    return json({ ok: true, notified })
  } catch { return json({ error: 'invalid_request' }, 400) }
})