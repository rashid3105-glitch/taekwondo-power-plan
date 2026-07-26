/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { brand, styles } from './brand.ts'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Din bekræftelseskode til {brand.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logo}>
            Sports<span style={styles.logoAccent}>talent</span>
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Bekræft din identitet</Heading>
          <Text style={styles.text}>Brug koden herunder for at fortsætte:</Text>
          <Text style={styles.code}>{token}</Text>
          <Text style={styles.footer}>
            Koden udløber om kort tid. Har du ikke bedt om den, kan du ignorere
            denne mail.
          </Text>
        </Section>
        <Text style={styles.legal}>{brand.legal}</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
