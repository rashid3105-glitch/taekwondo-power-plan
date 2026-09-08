import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SPORTSTALENT'

interface DemoSignupNotificationProps {
  userName?: string
  userEmail?: string
  clubName?: string | null
  role?: string | null
  sport?: string | null
  athleteBand?: string | null
  signedUpAt?: string | null
  adminUrl?: string
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <>
    <Text style={detailLabel}>{label}</Text>
    <Text style={detailValue}>{value || 'Ikke oplyst'}</Text>
    <Hr style={divider} />
  </>
)

const DemoSignupNotificationEmail = ({
  userName, userEmail, clubName, role, sport, athleteBand, signedUpAt, adminUrl,
}: DemoSignupNotificationProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Ny demo-tilmelding: {clubName || userName || userEmail || 'ukendt'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>Ny demo-tilmelding</Heading>
        </Section>
        <Text style={text}>Et nyt lead har oprettet en gratis prøvekonto på {SITE_NAME}.</Text>
        <Section style={detailsBox}>
          <Row label="Navn" value={userName} />
          <Row label="Email" value={userEmail} />
          <Row label="Klub" value={clubName} />
          <Row label="Rolle" value={role} />
          <Row label="Sport" value={sport} />
          <Row label="Antal atleter" value={athleteBand} />
          <Text style={detailLabel}>Tidspunkt</Text>
          <Text style={detailValue}>{signedUpAt || 'Ukendt'}</Text>
        </Section>
        {adminUrl ? (
          <Text style={text}>
            <Link href={adminUrl} style={link}>Åbn leadet i admin</Link>
          </Text>
        ) : null}
        <Text style={footer}>— {SITE_NAME} System</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DemoSignupNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Demo-tilmelding: ${data.clubName || data.userName || data.userEmail || 'ukendt'}`,
  displayName: 'Demo signup admin notification',
  to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'rashid3105@gmail.com',
  previewData: {
    userName: 'Kim Nedergaard',
    userEmail: 'kim@example.com',
    clubName: 'National Poomse Team Danmark',
    role: 'Træner',
    sport: 'Taekwondo',
    athleteBand: '16-30',
    signedUpAt: '2026-09-08 10:00',
    adminUrl: 'https://sportstalent.dk/admin/leads',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #D4AF37', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#111827', fontWeight: 'bold' as const }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#111827', margin: '0 0 10px' }
const divider = { borderColor: '#e5e7eb', margin: '10px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '20px 0 0' }
