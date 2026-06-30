import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface CoachInviteAdminNotificationProps {
  coachName?: string
  coachEmail?: string
  clubName?: string
  inviteCode?: string
  inviteUrl?: string
  createdAt?: string
}

const CoachInviteAdminNotificationEmail = ({
  coachName,
  coachEmail,
  clubName,
  inviteCode,
  inviteUrl,
  createdAt,
}: CoachInviteAdminNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Coach invite created on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>New athlete invite created</Heading>
        </Section>
        <Text style={text}>
          A coach has generated a new athlete invite on {SITE_NAME}:
        </Text>
        <Section style={detailsBox}>
          <Text style={detailLabel}>Coach</Text>
          <Text style={detailValue}>{coachName || 'Unknown'}{coachEmail ? ` (${coachEmail})` : ''}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Club</Text>
          <Text style={detailValue}>{clubName || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Invite code</Text>
          <Text style={detailValue}>{inviteCode || '—'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Invite link</Text>
          <Text style={detailValue}>{inviteUrl || '—'}</Text>
          {createdAt && (
            <>
              <Hr style={divider} />
              <Text style={detailLabel}>Created</Text>
              <Text style={detailValue}>{createdAt}</Text>
            </>
          )}
        </Section>
        <Text style={text}>
          Invited athletes are auto-approved when the coach belongs to an active club.
        </Text>
        <Text style={footer}>— {SITE_NAME} System</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CoachInviteAdminNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Coach invite created: ${data.coachName || data.coachEmail || 'Unknown'}${data.clubName ? ` — ${data.clubName}` : ''}`,
  displayName: 'Coach invite admin notification',
  to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'rashid3105@gmail.com',
  previewData: {
    coachName: 'Jane Coach',
    coachEmail: 'jane@example.com',
    clubName: 'Copenhagen City Taekwondo',
    inviteCode: 'ABC23XYZ',
    inviteUrl: 'https://sportstalent.dk/join/ABC23XYZ',
    createdAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#111827', margin: '0 0 10px', wordBreak: 'break-all' as const }
const divider = { borderTop: '1px solid #e5e7eb', margin: '8px 0' }
const footer = { fontSize: '11px', color: '#9ca3af', marginTop: '24px' }
