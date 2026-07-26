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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>Du er inviteret til {brand.name}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logo}>
            Sports<span style={styles.logoAccent}>talent</span>
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Section>
        <Section style={styles.card}>
          <Heading style={styles.h1}>Du er inviteret</Heading>
          <Text style={styles.text}>
            Din klub har inviteret dig til {brand.name}. Klik nedenfor for at
            acceptere invitationen og oprette din konto.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Accepter invitation
          </Button>
          <Text style={styles.footer}>
            Havde du ikke forventet denne invitation, kan du ignorere mailen.
          </Text>
        </Section>
        <Text style={styles.legal}>{brand.legal}</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
