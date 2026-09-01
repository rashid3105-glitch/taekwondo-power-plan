/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Heading, Link, Text } from 'npm:@react-email/components@0.0.22'

import { styles } from './brand.ts'
import { Layout } from './layout.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Layout preview={`Bekræft din e-mail for ${siteName}`}>
    <Heading style={styles.h1}>Bekræft din e-mail</Heading>
    <Text style={styles.text}>
      Tak fordi du oprettede dig på{' '}
      <Link href={siteUrl} style={styles.link}>
        <strong>{siteName}</strong>
      </Link>
      . Bekræft din e-mailadresse ({recipient}) ved at klikke på knappen
      nedenfor.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Bekræft e-mail
    </Button>
    <Text style={styles.footer}>
      Hvis du ikke har oprettet en konto, kan du roligt ignorere denne e-mail.
    </Text>
  </Layout>
)

export default SignupEmail
