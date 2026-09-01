/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Heading, Text } from 'npm:@react-email/components@0.0.22'

import { styles } from './brand.ts'
import { Layout } from './layout.tsx'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "fra" line must render oldEmail.
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Layout preview={`Bekræft ændring af e-mail for ${siteName}`}>
    <Heading style={styles.h1}>Bekræft din nye e-mail</Heading>
    <Text style={styles.text}>
      Du har bedt om at ændre din e-mailadresse på {siteName} fra {oldEmail}{' '}
      til {newEmail}. Klik på knappen nedenfor for at bekræfte ændringen.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Bekræft ændring
    </Button>
    <Text style={styles.footer}>
      Hvis du ikke har bedt om denne ændring, bør du sikre din konto med det
      samme.
    </Text>
  </Layout>
)

export default EmailChangeEmail
