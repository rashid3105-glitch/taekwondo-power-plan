import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const USER_ID = '874b624c-352a-425a-b144-1dfb9e729597'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await admin.auth.admin.updateUserById(USER_ID, {
    password: 'test1234!',
    email_confirm: true,
  })

  return new Response(
    JSON.stringify({ ok: !error, email: data?.user?.email, error: error?.message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error ? 500 : 200 },
  )
})
