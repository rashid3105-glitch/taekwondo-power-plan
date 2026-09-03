import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface Props {
  athleteName?: string
  consentUrl?: string
  expiresInDays?: number
  clubName?: string
  coachName?: string
  /** 0 = first send, 1..n = reminder number */
  reminderNumber?: number
  daysLeft?: number
}

const ParentalConsentEmail = ({
  athleteName, consentUrl, expiresInDays, clubName, coachName, reminderNumber, daysLeft,
}: Props) => {
  const child = athleteName || 'your child'
  const club = clubName || 'your club'
  const isReminder = (reminderNumber ?? 0) > 0
  const heading = isReminder
    ? `Still waiting: consent for ${child}`
    : `${club} needs your OK for ${child}`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isReminder
          ? `Reminder — ${child} cannot use training data until you approve`
          : `${club}: one click to approve ${child}'s training account`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={eyebrow}>{club} · {SITE_NAME}</Text>
            <Heading style={h1}>{heading}</Heading>
          </Section>

          <Text style={text}>Hello,</Text>

          <Text style={text}>
            {coachName ? <>{coachName} at <strong>{club}</strong></> : <strong>{club}</strong>}
            {' '}has set up a training account for <strong>{child}</strong>.
            Because {child} is a minor, the law requires a parent or guardian to approve
            before the club may work with their health data
            (heart rate, HRV, sleep, steps, weight and mental assessments).
          </Text>

          <Section style={factBox}>
            <Text style={factLine}><strong>What we ask:</strong> your approval — nothing else.</Text>
            <Text style={factLine}><strong>Time needed:</strong> about 60 seconds. No account, no password.</Text>
            <Text style={factLine}>
              <strong>If you do nothing:</strong> {child}'s health tracking stays switched off
              and the account is limited.
            </Text>
            <Text style={factLine}>
              <strong>You can change your mind:</strong> withdraw the approval at any time.
            </Text>
          </Section>

          {consentUrl && (
            <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
              <Button style={buttonStyle} href={consentUrl}>
                Approve in 60 seconds
              </Button>
            </Section>
          )}

          <Text style={text}>
            The link expires in {daysLeft ?? expiresInDays ?? 30} days.
            Not {child}'s parent or guardian? Open the link and choose
            &ldquo;This is not my child&rdquo; — the club is notified and we stop emailing you.
          </Text>

          <Text style={small}>
            If the button does not work, copy this link into your browser:<br />
            {consentUrl}
          </Text>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ParentalConsentEmail,
  subject: (d: Record<string, any>) =>
    (d.reminderNumber ?? 0) > 0
      ? `Reminder: ${d.athleteName || 'your child'} still needs your approval`
      : `${d.clubName || 'Your club'} needs your approval for ${d.athleteName || 'your child'}`,
  displayName: 'Parental consent request',
  previewData: {
    athleteName: 'Sara',
    clubName: 'Aarhus Taekwondo',
    coachName: 'Milad',
    consentUrl: 'https://sportstalent.dk/consent/example-token',
    expiresInDays: 30,
    reminderNumber: 0,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const eyebrow = { fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b7280', margin: '0 0 6px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const factBox = { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px 16px', margin: '0 0 8px' }
const factLine = { fontSize: '13px', color: '#374151', lineHeight: '1.6', margin: '0 0 8px' }
const small = { fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' as const, margin: '0 0 16px' }
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
