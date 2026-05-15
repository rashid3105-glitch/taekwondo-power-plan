import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"
const APP_URL = "https://app.sportstalent.dk"

interface AthleteActivityNotificationProps {
  athleteName?: string
  activityType?: 'diary' | 'competition_reflection'
  competitionName?: string
}

const AthleteActivityNotificationEmail = ({ athleteName, activityType, competitionName }: AthleteActivityNotificationProps) => {
  const isDiary = activityType === 'diary'
  const subject = isDiary
    ? `${athleteName} har lavet et dagbogsindlæg`
    : `${athleteName} har afsluttet en stævne-evaluering`
  const bodyText = isDiary
    ? `${athleteName} har skrevet et nyt indlæg i dagbogen. Log ind for at læse det.`
    : `${athleteName} har afsluttet sin evaluering af ${competitionName || 'et stævne'}. Log ind for at se resultatet.`

  return (
    <Html lang="da" dir="ltr">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={h1}>{SITE_NAME}</Heading>
          </Section>
          <Text style={text}>{bodyText}</Text>
          <Section style={detailsBox}>
            <Text style={detailLabel}>Atlet</Text>
            <Text style={detailValue}>{athleteName || '—'}</Text>
            <Hr style={divider} />
            <Text style={detailLabel}>Type</Text>
            <Text style={detailValue}>{isDiary ? 'Dagbogsindlæg' : 'Stævne-evaluering'}</Text>
            {!isDiary && competitionName && (
              <>
                <Hr style={divider} />
                <Text style={detailLabel}>Stævne</Text>
                <Text style={detailValue}>{competitionName}</Text>
              </>
            )}
          </Section>
          <Link href={APP_URL} style={ctaButton}>Log ind og se →</Link>
          <Text style={footer}>Du modtager denne email fordi du er træner i klubben. — {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AthleteActivityNotificationEmail,
  subject: (data: Record<string, any>) =>
    data.activityType === 'diary'
      ? `${data.athleteName} har lavet et dagbogsindlæg`
      : `${data.athleteName} har afsluttet en stævne-evaluering`,
  displayName: 'Athlete activity notification to coaches',
  previewData: { athleteName: 'Zainab Abdulkarim', activityType: 'diary' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #E8192C', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '15px', color: '#111827', margin: '0 0 8px', fontWeight: '500' as const }
const divider = { borderColor: '#e5e7eb', margin: '8px 0' }
const ctaButton = { display: 'block', backgroundColor: '#E8192C', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' as const, fontSize: '14px', textAlign: 'center' as const, margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
