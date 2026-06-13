import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface Props {
  coachName?: string
  athleteNames?: string[]
  total?: number
}

const CoachConsentReminderEmail = ({ coachName, athleteNames = [], total }: Props) => {
  const count = total ?? athleteNames.length
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{count} minor athlete(s) still need parental consent</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={h1}>Parental consent reminder</Heading>
          </Section>
          <Text style={text}>Hi {coachName || 'coach'},</Text>
          <Text style={text}>
            You have <strong>{count}</strong> minor athlete{count === 1 ? '' : 's'} on {SITE_NAME} whose
            parental consent for health data processing is still missing. Until consent is granted,
            their health metrics (heart rate, HRV, sleep, steps, weight, mental assessments) will
            not be stored.
          </Text>
          {athleteNames.length > 0 && (
            <Section style={listSection}>
              {athleteNames.map((n, i) => (
                <Text key={i} style={listItem}>• {n}</Text>
              ))}
            </Section>
          )}
          <Text style={text}>
            Open the coach dashboard and use the "Consent missing" panel to send each parent a
            secure consent request link.
          </Text>
          <Text style={footer}>— {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CoachConsentReminderEmail,
  subject: (d: Record<string, any>) => {
    const c = d.total ?? (Array.isArray(d.athleteNames) ? d.athleteNames.length : 0)
    return `Parental consent still missing for ${c} athlete${c === 1 ? '' : 's'}`
  },
  displayName: 'Coach consent reminder',
  previewData: {
    coachName: 'Coach',
    athleteNames: ['Sara', 'Jonas'],
    total: 2,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const listSection = { margin: '0 0 16px', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px' }
const listItem = { fontSize: '13px', color: '#374151', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
