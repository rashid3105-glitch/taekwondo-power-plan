/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { brand, styles } from './brand.ts'

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export const Layout = ({ preview, children }: LayoutProps) => (
  <Html lang="da" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logo}>
            SPORTS<span style={styles.logoAccent}>TALENT</span>
          </Text>
          <Text style={styles.tagline}>{brand.tagline}</Text>
        </Section>
        <Section style={styles.card}>{children}</Section>
        <Text style={styles.legal}>{brand.legal}</Text>
      </Container>
    </Body>
  </Html>
)

export default Layout
