import { createClient } from 'npm:@supabase/supabase-js@2'
import { verifyToken } from '../_shared/assessment-token.ts'

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!DOCTYPE html><html lang="da"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title></head>
<body style="margin:0;background:#F4F4F2;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:64px 20px;">
  <div style="font:800 12px Arial,Helvetica,sans-serif;letter-spacing:2px;color:#C9A227;text-transform:uppercase;">Sportstalent · Klubanalysen</div>
  <h1 style="font-size:26px;color:#0A0A0A;margin:16px 0 12px;">${title}</h1>
  <p style="font-size:16px;line-height:1.7;color:#55565A;margin:0 0 24px;">${body}</p>
  <a href="https://sportstalent.dk" style="display:inline-block;background:#C9A227;color:#0A0A0A;font-weight:800;padding:13px 24px;border-radius:8px;text-decoration:none;">Til sportstalent.dk</a>
</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  const secret = Deno.env.get('ASSESSMENT_TOKEN_SECRET')

  if (!secret) return page('Noget gik galt', 'Prøv igen senere.', 500)

  const result = await verifyToken(secret, 'unsub', token)
  if (!result.ok) {
    return page('Linket er ikke gyldigt', 'Afmeldingslinket kunne ikke genkendes. Skriv til farooq@sportstalent.dk, så klarer vi det manuelt.', 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await admin
    .from('club_assessments')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', result.id)
    .is('unsubscribed_at', null)

  if (error) {
    console.error('assessment-unsubscribe failed', error)
    return page('Noget gik galt', 'Vi kunne ikke registrere afmeldingen. Prøv igen om lidt.', 500)
  }

  return page('Du er afmeldt', 'Vi sender ikke flere mails om klubanalysen til denne adresse.')
})
