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
}

const AdultConsentEmail = ({ athleteName, consentUrl, expiresInDays }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Consent needed for health data processing on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>Consent required</Heading>
        </Section>
        <Text style={text}>Hi {athleteName || 'there'},</Text>
        <Text style={text}>
          Your coach has requested your consent so {SITE_NAME} may process your health data
          (heart rate, HRV, sleep, steps, weight and mental assessments). Until you approve,
          this data will not be stored.
        </Text>
        <Text style={text}>
          Please review and confirm on the link below. The link expires in
          {' '}{expiresInDays ?? 14}{' '}days.
        </Text>
        {consentUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={buttonStyle} href={consentUrl}>
              Review and give consent
            </Button>
          </Section>
        )}
        <Text style={small}>
          If the button does not work, copy this link into your browser:<br />
          {consentUrl}
        </Text>
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdultConsentEmail,
  subject: () => `Consent required for health data processing`,
  displayName: 'Adult consent request',
  previewData: {
    athleteName: 'Jonas',
    consentUrl: 'https://sportstalent.dk/consent/example-token',
    expiresInDays: 14,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
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
