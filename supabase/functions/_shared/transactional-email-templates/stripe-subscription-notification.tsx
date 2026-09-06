import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface StripeSubscriptionNotificationProps {
  eventType?: string
  clubName?: string
  tier?: string
  amount?: string
  customerEmail?: string
  status?: string
  note?: string
  occurredAt?: string
}

const StripeSubscriptionNotificationEmail = ({
  eventType,
  clubName,
  tier,
  amount,
  customerEmail,
  status,
  note,
  occurredAt,
}: StripeSubscriptionNotificationProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Stripe: {eventType || 'begivenhed'} — {clubName || 'ukendt klub'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>Stripe-begivenhed</Heading>
        </Section>
        <Section style={detailsBox}>
          <Text style={detailLabel}>Begivenhed</Text>
          <Text style={detailValue}>{eventType || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Klub</Text>
          <Text style={detailValue}>{clubName || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Trin</Text>
          <Text style={detailValue}>{tier || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Beløb</Text>
          <Text style={detailValue}>{amount || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Status</Text>
          <Text style={detailValue}>{status || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Kunde</Text>
          <Text style={detailValue}>{customerEmail || '—'}</Text>
          {occurredAt && (
            <>
              <Hr style={divider} />
              <Text style={detailLabel}>Tidspunkt</Text>
              <Text style={detailValue}>{occurredAt}</Text>
            </>
          )}
        </Section>
        {note && <Text style={text}>{note}</Text>}
        <Text style={footer}>— {SITE_NAME} System</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: StripeSubscriptionNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Stripe: ${data.eventType || 'begivenhed'} — ${data.clubName || 'ukendt klub'}${data.amount && data.amount !== '—' ? ` (${data.amount})` : ''}`,
  displayName: 'Stripe subscription notification',
  to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'rashid3105@gmail.com',
  previewData: {
    eventType: 'checkout.session.completed',
    clubName: 'Copenhagen City Taekwondo',
    tier: 'club',
    amount: '7.500,00 DKK',
    customerEmail: 'coach@example.com',
    status: 'active',
    occurredAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(46, 65%, 52%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#111827', margin: '0 0 10px', wordBreak: 'break-all' as const }
const divider = { borderTop: '1px solid #e5e7eb', margin: '8px 0' }
const footer = { fontSize: '11px', color: '#9ca3af', marginTop: '24px' }
