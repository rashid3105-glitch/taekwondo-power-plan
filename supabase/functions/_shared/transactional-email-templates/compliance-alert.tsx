import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface ComplianceAlertProps {
  recipientName?: string
  athleteName?: string
  isSelf?: boolean
  itemLabel?: string
  severity?: 'warning' | 'expired' | 'missing'
  dueDate?: string
  actionUrl?: string
}

function headline(severity?: string, itemLabel?: string) {
  if (severity === 'missing') return `${itemLabel || 'Requirement'} is missing`
  if (severity === 'expired') return `${itemLabel || 'Requirement'} has expired`
  return `${itemLabel || 'Requirement'} expires soon`
}

const ComplianceAlertEmail = ({
  recipientName, athleteName, isSelf, itemLabel, severity, dueDate, actionUrl,
}: ComplianceAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{headline(severity, itemLabel)}{athleteName && !isSelf ? ` — ${athleteName}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>⚠️ {headline(severity, itemLabel)}</Heading>
        </Section>
        <Text style={text}>Hi {recipientName || 'there'},</Text>
        <Text style={text}>
          {isSelf
            ? `This is a reminder about your ${itemLabel || 'requirement'}.`
            : `This is a reminder about ${athleteName || 'an athlete'}'s ${itemLabel || 'requirement'}.`}
        </Text>
        <Section style={box}>
          <Text style={boxTitle}>{itemLabel || 'Requirement'}</Text>
          {!isSelf && athleteName && <Text style={boxLine}>Athlete: {athleteName}</Text>}
          {severity === 'missing'
            ? <Text style={boxLine}>Status: not registered</Text>
            : dueDate && <Text style={boxLine}>{severity === 'expired' ? 'Expired' : 'Valid until'}: {dueDate}</Text>}
        </Section>
        <Text style={text}>
          Please make sure the information is renewed and updated in Sportstalent.
        </Text>
        {actionUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={buttonStyle} href={actionUrl}>Open Sportstalent</Button>
          </Section>
        )}
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ComplianceAlertEmail,
  subject: (data: Record<string, any>) =>
    `⚠️ ${headline(data.severity, data.itemLabel)}${data.athleteName && !data.isSelf ? ` — ${data.athleteName}` : ''}`,
  displayName: 'License / anti-doping compliance alert',
  previewData: {
    recipientName: 'Coach Kim',
    athleteName: 'Sara',
    isSelf: false,
    itemLabel: 'GAL license',
    severity: 'warning',
    dueDate: '2026-08-20',
    actionUrl: 'https://sportstalent.dk/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #D4AF37', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const box = { backgroundColor: '#fdf8e7', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px', border: '1px solid #e8d79a' }
const boxTitle = { fontSize: '18px', color: '#111827', margin: '0 0 6px', fontWeight: '600' as const }
const boxLine = { fontSize: '14px', color: '#374151', margin: '0 0 4px' }
const buttonStyle = {
  backgroundColor: '#D4AF37',
  color: '#111111',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600' as const,
  fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
