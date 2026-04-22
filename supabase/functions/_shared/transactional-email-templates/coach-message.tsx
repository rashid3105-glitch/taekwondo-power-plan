import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface CoachMessageProps {
  athleteName?: string
  coachName?: string
  subject?: string
  body?: string
  inboxUrl?: string
}

const CoachMessageEmail = ({ athleteName, coachName, subject, body, inboxUrl }: CoachMessageProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>💬 Message from {coachName || 'your coach'}: {subject || ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>💬 Message from your coach</Heading>
        </Section>
        <Text style={text}>
          Hi {athleteName || 'Athlete'},
        </Text>
        <Text style={text}>
          {coachName ? <strong>{coachName}</strong> : 'Your coach'} sent you a message:
        </Text>
        <Section style={messageBox}>
          <Text style={subjectStyle}>{subject || 'New message'}</Text>
          {body && (
            <>
              <Hr style={divider} />
              <Text style={bodyStyle}>{body}</Text>
            </>
          )}
        </Section>
        {inboxUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={buttonStyle} href={inboxUrl}>
              Open Dashboard
            </Button>
          </Section>
        )}
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CoachMessageEmail,
  subject: (data: Record<string, any>) => `💬 ${data.coachName || 'Your coach'}: ${data.subject || 'New message'}`,
  displayName: 'Coach message to athlete',
  previewData: {
    athleteName: 'Sara',
    coachName: 'Coach Kim',
    subject: 'Practice cancelled tonight',
    body: 'Hall is closed for maintenance — we will resume Wednesday at 6pm. Use today for mobility and recovery.',
    inboxUrl: 'https://taekwondo-power-plan.lovable.app/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const messageBox = { backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px', border: '1px solid #bae6fd' }
const subjectStyle = { fontSize: '18px', color: '#111827', margin: '0 0 4px', fontWeight: '600' as const }
const divider = { borderColor: '#bae6fd', margin: '8px 0' }
const bodyStyle = { fontSize: '14px', color: '#374151', margin: '0', whiteSpace: 'pre-wrap' as const }
const buttonStyle = {
  backgroundColor: 'hsl(190, 95%, 40%)',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600' as const,
  fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
