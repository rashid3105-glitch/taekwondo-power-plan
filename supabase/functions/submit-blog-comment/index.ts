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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  // Honeypot — if a bot fills the hidden field, fake success
  if (body.website && String(body.website).trim().length > 0) {
    return json({ success: true })
  }

  const post_id = String(body.post_id || '').trim()
  const author_name = String(body.author_name || '').trim()
  const author_email = String(body.author_email || '').trim().toLowerCase()
  const content = String(body.content || '').trim()

  if (!post_id || !author_name || !author_email || !content) {
    return json({ error: 'missing_fields' }, 400)
  }
  if (author_name.length > 80) return json({ error: 'name_too_long' }, 400)
  if (content.length > 5000) return json({ error: 'content_too_long' }, 400)
  if (content.length < 2) return json({ error: 'content_too_short' }, 400)
  if (!EMAIL_RE.test(author_email) || author_email.length > 254) {
    return json({ error: 'invalid_email' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // Verify post exists & is published
  const { data: post } = await admin
    .from('blog_posts')
    .select('id, title, slug')
    .eq('id', post_id)
    .maybeSingle()
  if (!post) return json({ error: 'post_not_found' }, 404)

  // Rate limit: >3 pending_verification from this email in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('blog_comments')
    .select('id', { count: 'exact', head: true })
    .eq('author_email', author_email)
    .eq('status', 'pending_verification')
    .gte('created_at', oneHourAgo)
  if ((count ?? 0) >= 3) {
    return json({ error: 'rate_limited' }, 429)
  }

  // Generate verification token
  const tokenBytes = new Uint8Array(32)
  crypto.getRandomValues(tokenBytes)
  const verification_token = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: inserted, error: insertError } = await admin
    .from('blog_comments')
    .insert({
      post_id,
      author_name,
      author_email,
      content,
      status: 'pending_verification',
      verification_token,
      token_expires_at,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('Failed to insert blog comment', insertError)
    return json({ error: 'insert_failed' }, 500)
  }

  // Build confirm URL — use referer origin if available, fallback to sportstalent.dk
  const referer = req.headers.get('referer') || req.headers.get('origin') || ''
  let origin = 'https://sportstalent.dk'
  try {
    if (referer) origin = new URL(referer).origin
  } catch { /* ignore */ }
  const confirmUrl = `${origin}/blog-comment/confirm?token=${verification_token}`

  // Send verification email via send-transactional-email using service-role auth
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        templateName: 'blog-comment-verification',
        recipientEmail: author_email,
        idempotencyKey: `blog-comment-verify-${inserted.id}`,
        templateData: {
          authorName: author_name,
          confirmUrl,
          postTitle: (post as any).title,
        },
      }),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.warn('send-transactional-email failed', res.status, txt)
    }
  } catch (e) {
    console.warn('send-transactional-email fetch threw', e)
  }

  return json({ success: true })
})
