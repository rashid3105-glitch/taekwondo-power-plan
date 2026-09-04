import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { DIMENSION_CONTENT, LEVEL_CONTENT } from '../club-assessment-content.ts'

const SITE_NAME = "SPORTSTALENT"

interface ClubAssessmentNotificationProps {
  assessmentId?: string
  clubName?: string
  email?: string
  sport?: string
  role?: string
  level?: number
  scores?: number[]
  isTest?: boolean
  adminUrl?: string
}

function weakestIndex(scores: number[]): number {
  let idx = 0
  scores.forEach((s, i) => {
    if (s < scores[idx]) idx = i
  })
  return idx
}

const ClubAssessmentNotificationEmail = ({
  clubName, email, sport, role, level, scores, isTest, adminUrl,
}: ClubAssessmentNotificationProps) => {
  const s = Array.isArray(scores) && scores.length === 5 ? scores : [0, 0, 0, 0, 0]
  const wi = weakestIndex(s)
  const weakName = DIMENSION_CONTENT[wi]?.name ?? '—'
  const lvl = Number(level) || 1
  const levelName = LEVEL_CONTENT[lvl - 1]?.name ?? ''

  return (
    <Html lang="da" dir="ltr">
      <Head />
      <Preview>{`Niveau ${lvl} — svagest: ${weakName} (${s[wi]}/9) — ${clubName || 'klub ikke oplyst'}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={h1}>{isTest ? '[TEST] ' : ''}Ny klubanalyse</Heading>
          </Section>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Klub</Text>
            <Text style={detailValue}>{clubName || 'ikke oplyst'}</Text>
            <Hr style={divider} />
            <Text style={detailLabel}>Email</Text>
            <Text style={detailValue}>{email || '—'}</Text>
            <Hr style={divider} />
            <Text style={detailLabel}>Sport</Text>
            <Text style={detailValue}>{sport || 'ikke oplyst'}</Text>
            <Hr style={divider} />
            <Text style={detailLabel}>Rolle</Text>
            <Text style={detailValue}>{role || 'ikke oplyst'}</Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Niveau</Text>
            <Text style={detailValue}>{lvl}{levelName ? ` — ${levelName}` : ''}</Text>
            <Hr style={divider} />
            <Text style={detailLabel}>Svageste dimension</Text>
            <Text style={detailValue}>{weakName} ({s[wi]}/9)</Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Alle scores</Text>
            {DIMENSION_CONTENT.map((d, i) => (
              <Text key={d.key} style={scoreLine}>{d.name}: {s[i]}/9</Text>
            ))}
          </Section>

          {adminUrl && (
            <Text style={text}>
              <Link href={adminUrl} style={link}>Åbn besvarelsen i admin</Link>
            </Text>
          )}

          <Text style={footer}>— {SITE_NAME} System</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ClubAssessmentNotificationEmail,
  subject: (data: Record<string, any>) => {
    const s: number[] = Array.isArray(data.scores) && data.scores.length === 5
      ? data.scores : [0, 0, 0, 0, 0]
    const wi = weakestIndex(s)
    const weakName = DIMENSION_CONTENT[wi]?.name ?? '—'
    const club = data.clubName || data.email || 'klub ikke oplyst'
    return `${data.isTest ? '[TEST] ' : ''}Klubanalyse: niveau ${Number(data.level) || 1} — svagest: ${weakName} (${s[wi]}/9) — ${club}`
  },
  displayName: 'Klubanalyse admin-notifikation',
  to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'rashid3105@gmail.com',
  previewData: {
    assessmentId: '00000000-0000-0000-0000-000000000000',
    clubName: 'Bulsajo Kamp',
    email: 'bulsajo.kamp@gmail.com',
    sport: 'Taekwondo',
    role: 'Cheftræner',
    level: 2,
    scores: [4, 3, 2, 4, 3],
    isTest: false,
    adminUrl: 'https://sportstalent.dk/admin/klubanalyser',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #D4AF37', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#8a6d1f', textDecoration: 'underline' }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 16px' }
const detailLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '15px', color: '#111827', margin: '0 0 8px', fontWeight: '500' as const }
const scoreLine = { fontSize: '14px', color: '#111827', margin: '0 0 4px' }
const divider = { borderColor: '#e5e7eb', margin: '8px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
