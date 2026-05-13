/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const MASCOT_URL =
  'https://phudximaihknfsmkizix.supabase.co/storage/v1/object/public/email-assets/toddy-mascot.png?v=3'

export const SignupEmail = ({ confirmationUrl }: SignupEmailProps) => (
  <Html lang="sv" dir="ltr">
    <Head />
    <Preview>Välkommen till Toddy — bekräfta din e-post</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand-block med maskoten — fungerar även om bilder blockeras */}
        <Section style={hero}>
          <Img
            src={MASCOT_URL}
            alt="🐢"
            width="96"
            height="96"
            style={mascot}
          />
          <Text style={brand}>Toddy</Text>
          <Text style={tagline}>din lugna stämningsdagbok</Text>
        </Section>

        <Section style={content}>
          <Heading style={h1}>Välkommen till Toddy</Heading>
          <Text style={text}>
            Vad kul att du är här. Toddy hjälper dig att förstå dina mönster
            över tid — i din egen takt, helt på dina villkor.
          </Text>
          <Text style={text}>
            Bekräfta din e-postadress nedan så är du igång.
          </Text>

          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>
              Bekräfta e-post
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Skapade du inte ett konto? Då kan du tryggt ignorera det här
            mejlet.
          </Text>
          <Text style={signature}>
            Varma hälsningar,<br />
            Toddy 🐢
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
}

const container = {
  maxWidth: '520px',
  margin: '0 auto',
  borderRadius: '20px',
  overflow: 'hidden' as const,
  border: '1px solid #ECEEF2',
  backgroundColor: '#ffffff',
}

const hero = {
  backgroundColor: '#FFF8E5',
  padding: '36px 24px 28px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #F2E6BE',
}

const mascot = {
  display: 'block',
  margin: '0 auto 8px',
  backgroundColor: '#FFF8E5',
  borderRadius: '12px',
}

const brand = {
  color: '#0E1626',
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  margin: '8px 0 2px',
}

const tagline = {
  color: '#8A7A4A',
  fontSize: '13px',
  fontWeight: 500,
  margin: 0,
}

const content = { padding: '32px 32px 28px' }

const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: '#0E1626',
  margin: '0 0 16px',
  lineHeight: 1.25,
}

const text = {
  fontSize: '15px',
  color: '#4B5563',
  lineHeight: 1.65,
  margin: '0 0 14px',
}

const buttonWrap = { textAlign: 'center' as const, margin: '28px 0 8px' }

const button = {
  backgroundColor: '#E8B931',
  color: '#0E1626',
  fontSize: '15px',
  fontWeight: 600,
  borderRadius: '999px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #ECEEF2',
  margin: '32px 0 20px',
}

const footer = {
  fontSize: '13px',
  color: '#9CA3AF',
  margin: '0 0 18px',
  lineHeight: 1.5,
}

const signature = {
  fontSize: '14px',
  color: '#0E1626',
  margin: 0,
  lineHeight: 1.5,
}
