/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { brand, styles } from './brand.ts'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Bekræft din e-mail hos {brand.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logo}>
            Sports<span style={styles.logoAccent}>talent</span>
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Bekræft din e-mail</Heading>
          <Text style={styles.text}>
            Velkommen til {brand.name}. Bekræft adressen {recipient} for at
            aktivere din konto.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Bekræft e-mail
          </Button>
          <Text style={styles.footer}>
            Har du ikke oprettet en konto, kan du roligt ignorere denne mail.
          </Text>
        </Section>
        <Text style={styles.legal}>{brand.legal}</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
