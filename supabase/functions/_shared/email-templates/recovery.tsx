/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Heading, Text } from 'npm:@react-email/components@0.0.22'

import { styles } from './brand.ts'
import { Layout } from './layout.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Layout preview={`Nulstil din adgangskode til ${siteName}`}>
    <Heading style={styles.h1}>Nulstil din adgangskode</Heading>
    <Text style={styles.text}>
      Vi har modtaget en anmodning om at nulstille adgangskoden til din konto
      på {siteName}. Klik på knappen nedenfor for at vælge en ny adgangskode.
    </Text>
    <Button style={styles.button} href={confirmationUrl}>
      Nulstil adgangskode
    </Button>
    <Text style={styles.footer}>
      Hvis du ikke har bedt om at nulstille din adgangskode, kan du ignorere
      denne e-mail. Din adgangskode bliver ikke ændret.
    </Text>
  </Layout>
)

export default RecoveryEmail
