import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Notification-only bookkeeping: Lovable enforces suppression at send time.
// These writes keep the app's own history tables in sync for reporting.
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'

const LOG_STATUS: Record<Reason, string> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}

const LOG_MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

async function record(reason: Reason, event: any) {
  const email = String(event.data?.recipient ?? '').toLowerCase()
  if (!email) return

  const { error: suppressError } = await admin
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('suppressed_emails upsert failed', {
      event_id: event.event_id,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('suppression write failed')
  }

  const { error: logError } = await admin.from('email_send_log').insert({
    message_id: event.data?.message_id ?? null,
    template_name: 'system',
    recipient_email: email,
    status: LOG_STATUS[reason],
    error_message: LOG_MESSAGE[reason],
    metadata: null,
  })
  if (logError) {
    console.error('email_send_log insert failed', {
      event_id: event.event_id,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('log write failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record('bounce', event)
    },
    'email.complaint': async (event) => {
      await record('complaint', event)
    },
    'email.unsubscribed': async (event) => {
      await record('unsubscribe', event)
    },
  },
})

Deno.serve((req) => handler(req))
