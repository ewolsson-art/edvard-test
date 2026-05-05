/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Din verifieringskod för Toddy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bekräfta din identitet</Heading>
        <Text style={text}>Använd koden nedan för att bekräfta:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Koden upphör att gälla snart. Bad du inte om den kan du ignorera mailet.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '480px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0E1626', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#0E1626',
  letterSpacing: '0.2em',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
