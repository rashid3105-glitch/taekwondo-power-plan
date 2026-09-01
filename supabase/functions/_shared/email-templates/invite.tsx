/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22'

import { styles } from './brand.ts'
import { Layout } from './layout.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Layout preview={`Du er inviteret til ${siteName}`}>
    <Heading style={styles.h1}>Du er inviteret</Heading>
    <Text style={styles.text}>
      Du er blevet inviteret til{' '}
      <Link href={siteUrl} style={styles.link}>
        <strong>{siteName}</strong>
      </Link>
      . Klik på knappen nedenfor for at acceptere invitationen og oprette din
      konto.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Accepter invitation
    </Button>
    <Text style={styles.footer}>
      Hvis du ikke forventede denne invitation, kan du roligt ignorere denne
      e-mail.
    </Text>
  </Layout>
)

export default InviteEmail
