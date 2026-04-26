import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface DigestAthlete { name: string; note?: string }
interface CoachWeeklyDigestProps {
  coachName?: string
  trendingUp?: DigestAthlete[]
  atRisk?: DigestAthlete[]
  inactive?: DigestAthlete[]
  totalAthletes?: number
  dashboardUrl?: string
}

const renderList = (items?: DigestAthlete[]) =>
  (items && items.length > 0) ? items.map((a, i) => (
    <Text key={i} style={listItem}>• <strong>{a.name}</strong>{a.note ? ` — ${a.note}` : ''}</Text>
  )) : <Text style={emptyItem}>None this week.</Text>

const CoachWeeklyDigestEmail = ({
  coachName, trendingUp, atRisk, inactive, totalAthletes, dashboardUrl,
}: CoachWeeklyDigestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`📊 Your weekly squad digest — ${totalAthletes ?? 0} athletes`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>📊 Weekly Squad Digest</Heading>
        </Section>
        <Text style={text}>Hi {coachName || 'Coach'},</Text>
        <Text style={text}>Here's the week-over-week snapshot of your {totalAthletes ?? 0} athletes:</Text>

        <Section style={sectionUp}>
          <Text style={sectionTitle}>📈 Trending up</Text>
          {renderList(trendingUp)}
        </Section>

        <Section style={sectionRisk}>
          <Text style={sectionTitle}>⚠️ At risk</Text>
          {renderList(atRisk)}
        </Section>

        <Section style={sectionInactive}>
          <Text style={sectionTitle}>💤 Inactive (0 sessions in last 7 days)</Text>
          {renderList(inactive)}
        </Section>

        {dashboardUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={buttonStyle} href={dashboardUrl}>Open Coach Dashboard</Button>
          </Section>
        )}

        <Hr style={divider} />
        <Text style={footer}>You can turn off this email in Settings → Notifications.</Text>
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CoachWeeklyDigestEmail,
  subject: (data: Record<string, any>) =>
    `📊 Weekly digest — ${(data.trendingUp?.length ?? 0)} up, ${(data.atRisk?.length ?? 0)} at risk`,
  displayName: 'Coach weekly squad digest',
  previewData: {
    coachName: 'Coach Kim',
    totalAthletes: 6,
    trendingUp: [{ name: 'Sara', note: '+18% load, mood up' }, { name: 'Leo', note: 'PR on standing long jump' }],
    atRisk: [{ name: 'Noah', note: 'Strain elevated 2 weeks' }],
    inactive: [{ name: 'Mia', note: '0 sessions logged' }],
    dashboardUrl: 'https://sportstalent.dk/coach',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const sectionTitle = { fontSize: '14px', fontWeight: '700' as const, color: '#111827', margin: '0 0 8px' }
const sectionUp = { backgroundColor: '#ecfdf5', borderRadius: '8px', padding: '14px 18px', margin: '0 0 12px', border: '1px solid #a7f3d0' }
const sectionRisk = { backgroundColor: '#fef2f2', borderRadius: '8px', padding: '14px 18px', margin: '0 0 12px', border: '1px solid #fecaca' }
const sectionInactive = { backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '14px 18px', margin: '0 0 12px', border: '1px solid #d1d5db' }
const listItem = { fontSize: '13px', color: '#374151', margin: '0 0 4px', lineHeight: '1.5' }
const emptyItem = { fontSize: '13px', color: '#9ca3af', margin: '0', fontStyle: 'italic' as const }
const divider = { borderColor: '#e5e7eb', margin: '20px 0 12px' }
const buttonStyle = {
  backgroundColor: 'hsl(190, 95%, 40%)', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: '600' as const, fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '6px 0 0' }
