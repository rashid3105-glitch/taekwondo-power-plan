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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Nulstil din adgangskode hos {brand.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logo}>
            Sports<span style={styles.logoAccent}>talent</span>
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Nulstil din adgangskode</Heading>
          <Text style={styles.text}>
            Vi har modtaget en anmodning om at nulstille adgangskoden til din
            {' '}{brand.name}-konto. Klik nedenfor for at vælge en ny.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Vælg ny adgangskode
          </Button>
          <Text style={styles.footer}>
            Har du ikke bedt om nulstilling, kan du ignorere denne mail. Din
            adgangskode bliver ikke ændret.
          </Text>
        </Section>
        <Text style={styles.legal}>{brand.legal}</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
