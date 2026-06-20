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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let token = ''
  if (req.method === 'GET') {
    const url = new URL(req.url)
    token = url.searchParams.get('token') || ''
  } else {
    try {
      const body = await req.json()
      token = String(body.token || '')
    } catch {
      return json({ error: 'invalid_json' }, 400)
    }
  }

  token = token.trim()
  if (!token || token.length < 16 || token.length > 128) {
    return json({ error: 'invalid_token' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const nowIso = new Date().toISOString()

  const { data: rows, error: updateError } = await admin
    .from('blog_comments')
    .update({
      status: 'pending_approval',
      verified_at: nowIso,
      verification_token: null,
    })
    .eq('verification_token', token)
    .eq('status', 'pending_verification')
    .gt('token_expires_at', nowIso)
    .select('id')

  if (updateError) {
    console.error('confirm-blog-comment update failed', updateError)
    return json({ error: 'server_error' }, 500)
  }

  if (!rows || rows.length === 0) {
    return json({ error: 'invalid_or_expired' }, 410)
  }

  return json({ success: true })
})
