/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Heading, Text } from 'npm:@react-email/components@0.0.22'

import { styles } from './brand.ts'
import { Layout } from './layout.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Layout preview={`Dit login-link til ${siteName}`}>
    <Heading style={styles.h1}>Dit login-link</Heading>
    <Text style={styles.text}>
      Klik på knappen nedenfor for at logge ind på {siteName}. Linket udløber
      om kort tid.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Log ind
    </Button>
    <Text style={styles.footer}>
      Hvis du ikke har bedt om dette link, kan du roligt ignorere denne e-mail.
    </Text>
  </Layout>
)

export default MagicLinkEmail
