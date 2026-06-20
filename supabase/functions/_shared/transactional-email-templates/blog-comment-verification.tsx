import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Sportstalent"

interface Props {
  authorName?: string
  confirmUrl?: string
  postTitle?: string
}

const BlogCommentVerification = ({ authorName, confirmUrl, postTitle }: Props) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Bekræft din kommentar på {SITE_NAME} / Confirm your comment</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>Bekræft din kommentar</Heading>
        </Section>
        <Text style={text}>Hej {authorName || ''},</Text>
        <Text style={text}>
          Tak for din kommentar{postTitle ? ` på "${postTitle}"` : ''}. Klik på knappen nedenfor for at bekræfte din emailadresse.
          Efter bekræftelse vil din kommentar blive gennemgået af en moderator før den vises offentligt.
        </Text>
        {confirmUrl && (
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={buttonStyle} href={confirmUrl}>Bekræft kommentar / Confirm comment</Button>
          </Section>
        )}
        <Text style={small}>
          Hvis knappen ikke virker, kopier dette link til din browser:<br />
          {confirmUrl}
        </Text>
        <Text style={text}>
          ——
        </Text>
        <Text style={text}>Hi {authorName || ''},</Text>
        <Text style={text}>
          Thanks for your comment{postTitle ? ` on "${postTitle}"` : ''}. Click the button above to verify your email address.
          After verification, your comment will be reviewed by a moderator before it appears publicly.
        </Text>
        <Text style={small}>
          Hvis du ikke har skrevet denne kommentar, kan du ignorere denne email. / If you didn't write this comment, you can ignore this email.
        </Text>
        <Text style={footer}>— {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BlogCommentVerification,
  subject: 'Bekræft din kommentar / Confirm your comment',
  displayName: 'Blog comment verification',
  previewData: {
    authorName: 'Anna',
    confirmUrl: 'https://sportstalent.dk/blog-comment/confirm?token=example',
    postTitle: 'Eksempel artikel',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { borderBottom: '3px solid #F5C842', paddingBottom: '12px', marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' as const, margin: '0 0 16px' }
const buttonStyle = {
  backgroundColor: '#F5C842',
  color: '#0B0C14',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '700' as const,
  fontSize: '14px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
