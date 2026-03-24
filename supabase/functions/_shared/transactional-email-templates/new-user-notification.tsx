import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "SPORTSTALENT"

interface NewUserNotificationProps {
  userName?: string
  userEmail?: string
  isDemo?: boolean
}

const NewUserNotificationEmail = ({ userName, userEmail, isDemo }: NewUserNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New user signed up on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>New User Registration</Heading>
        </Section>
        <Text style={text}>
          A new user has signed up on {SITE_NAME}:
        </Text>
        <Section style={detailsBox}>
          <Text style={detailLabel}>Name</Text>
          <Text style={detailValue}>{userName || 'Not provided'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Email</Text>
          <Text style={detailValue}>{userEmail || 'Not provided'}</Text>
          <Hr style={divider} />
          <Text style={detailLabel}>Account Type</Text>
          <Text style={detailValue}>{isDemo ? 'Demo Account' : 'Full Account'}</Text>
        </Section>
        <Text style={text}>
          Please review and approve this user in the admin panel.
        </Text>
        <Text style={footer}>— {SITE_NAME} System</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewUserNotificationEmail,
  subject: (data: Record<string, any>) => `New user signup: ${data.userName || data.userEmail || 'Unknown'}`,
  displayName: 'New user admin notification',
  to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'rashid3105@gmail.com',
  previewData: { userName: 'John Doe', userEmail: 'john@example.com', isDemo: false },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid hsl(190, 95%, 50%)', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '11px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '15px', color: '#111827', margin: '0 0 8px', fontWeight: '500' as const }
const divider = { borderColor: '#e5e7eb', margin: '8px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
