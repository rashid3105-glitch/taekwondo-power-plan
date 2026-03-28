import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface EventReminderProps {
  athleteName?: string
  coachName?: string
  eventTitle?: string
  eventDate?: string
  message?: string
  diaryUrl?: string
}

const EventReminderEmail = ({ athleteName, coachName, eventTitle, eventDate, message, diaryUrl }: EventReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>📝 Reminder: Write notes for {eventTitle || 'your event'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>📝 Event Reminder</Heading>
        </Section>
        <Text style={text}>
          Hi {athleteName || 'Athlete'},
        </Text>
        <Text style={text}>
          Your coach {coachName ? <strong>{coachName}</strong> : ''} wants you to remember to write notes about:
        </Text>
        <Section style={eventBox}>
          <Text style={eventTitle_style}>{eventTitle || 'Event'}</Text>
          {eventDate && <Text style={eventDate_style}>📅 {eventDate}</Text>}
          {message && (
            <>
              <Hr style={divider} />
              <Text style={messageStyle}>{message}</Text>
            </>
          )}
        </Section>
        <Text style={text}>
          Open your diary and write your thoughts, reflections and observations about this event.
        </Text>
        {diaryUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={buttonStyle} href={diaryUrl}>
              Open Diary
            </Button>
          </Section>
        )}
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EventReminderEmail,
  subject: (data: Record<string, any>) => `📝 Reminder: ${data.eventTitle || 'Write notes for your event'}`,
  displayName: 'Event reminder for athlete',
  previewData: {
    athleteName: 'Sara',
    coachName: 'Coach Kim',
    eventTitle: 'Nordic Open 2025',
    eventDate: '2025-04-15',
    message: 'Remember to note down what went well and what to improve for next time.',
    diaryUrl: 'https://taekwondo-power-plan.lovable.app/diary',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const eventBox = { backgroundColor: '#f0f9ff', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px', border: '1px solid #bae6fd' }
const eventTitle_style = { fontSize: '18px', color: '#111827', margin: '0 0 4px', fontWeight: '600' as const }
const eventDate_style = { fontSize: '14px', color: '#0284c7', margin: '0 0 4px', fontWeight: '500' as const }
const divider = { borderColor: '#bae6fd', margin: '8px 0' }
const messageStyle = { fontSize: '14px', color: '#374151', margin: '0', fontStyle: 'italic' as const }
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
