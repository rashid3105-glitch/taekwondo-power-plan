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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Dit login-link til {brand.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logo}>
            Sports<span style={styles.logoAccent}>talent</span>
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Dit login-link</Heading>
          <Text style={styles.text}>
            Klik nedenfor for at logge ind på {brand.name}. Linket udløber om
            kort tid.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Log ind
          </Button>
          <Text style={styles.footer}>
            Har du ikke bedt om dette link, kan du roligt ignorere denne mail.
          </Text>
        </Section>
        <Text style={styles.legal}>{brand.legal}</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
