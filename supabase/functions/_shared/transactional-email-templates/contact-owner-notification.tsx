import * as React from 'npm:react@18.3.1'
import { Html, Head, Preview, Body, Container, Heading, Text, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; email?: string; message?: string }
const ContactOwnerEmail = ({ name, email, message }: Props) => (
  <Html lang="da"><Head /><Preview>Ny henvendelse til SPORTS TALENT</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
      <Container style={{ maxWidth: '540px', padding: '28px' }}>
        <Heading style={{ color: '#1F5BD8', fontSize: '24px' }}>Ny klubhenvendelse</Heading>
        <Text>{name}</Text><Text>{email}</Text>
        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{message}</Text>
        <Link href="https://sportstalent.dk/admin/leads">Se henvendelser i administrationen</Link>
      </Container>
    </Body>
  </Html>
)
export const template = {
  component: ContactOwnerEmail,
  subject: 'SPORTS TALENT — ny kontaktforespørgsel',
  to: 'rashid3105@gmail.com',
  displayName: 'Contact owner notification',
  previewData: { name: 'Testklub', email: 'club@example.com', message: '[Demo]\nVi ønsker en gennemgang.' },
} satisfies TemplateEntry