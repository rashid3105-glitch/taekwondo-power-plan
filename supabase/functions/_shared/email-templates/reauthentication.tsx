/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Heading, Text } from 'npm:@react-email/components@0.0.22'

import { styles } from './brand.ts'
import { Layout } from './layout.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Layout preview="Din bekræftelseskode">
    <Heading style={styles.h1}>Bekræft din identitet</Heading>
    <Text style={styles.text}>
      Brug koden nedenfor for at bekræfte din identitet:
    </Text>
    <Text style={styles.code}>{token}</Text>
    <Text style={styles.footer}>
      Koden udløber om kort tid. Hvis du ikke har bedt om den, kan du roligt
      ignorere denne e-mail.
    </Text>
  </Layout>
)

export default ReauthenticationEmail
