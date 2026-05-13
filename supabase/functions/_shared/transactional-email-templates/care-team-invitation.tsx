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
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Toddy'
const APP_URL = 'https://toddy.se'

type InviterRole = 'patient' | 'doctor' | 'relative'

interface CareTeamInvitationProps {
  /** Förnamn på personen som skickar inbjudan */
  inviterName?: string
  /** Vad inbjudaren är: användare, läkare eller anhörig */
  inviterRole?: InviterRole
  /** Vad mottagaren bjuds in som (relation till inbjudaren) */
  recipientRole?: 'doctor' | 'relative' | 'patient'
}

const ROLE_LABEL: Record<NonNullable<CareTeamInvitationProps['recipientRole']>, string> = {
  doctor: 'vårdgivare',
  relative: 'anhörig',
  patient: 'användare',
}

function buildIntro(
  inviterName: string,
  inviterRole: InviterRole,
  recipientRole: NonNullable<CareTeamInvitationProps['recipientRole']>,
): string {
  // Patient bjuder in läkare eller anhörig att följa sitt mående
  if (inviterRole === 'patient' && recipientRole === 'doctor') {
    return `${inviterName} vill att du som vårdgivare ska få insyn i deras mående via Toddy — en stämningsdagbok byggd för bipolär sjukdom.`
  }
  if (inviterRole === 'patient' && recipientRole === 'relative') {
    return `${inviterName} vill dela sitt mående med dig som anhörig via Toddy — en stämningsdagbok som hjälper er båda fånga tidiga varningssignaler.`
  }
  // Läkare eller anhörig ber om åtkomst
  if (inviterRole === 'doctor') {
    return `${inviterName} är vårdgivare på Toddy och vill följa ditt mående för att kunna stötta dig bättre. Du bestämmer själv vad som delas.`
  }
  if (inviterRole === 'relative') {
    return `${inviterName} är anhörig på Toddy och vill följa ditt mående för att finnas där när det behövs. Du bestämmer själv vad som delas.`
  }
  return `${inviterName} har bjudit in dig till Toddy.`
}

const CareTeamInvitationEmail = ({
  inviterName = 'Någon',
  inviterRole = 'patient',
  recipientRole = 'relative',
}: CareTeamInvitationProps) => {
  const intro = buildIntro(inviterName, inviterRole, recipientRole)
  const ctaLabel =
    inviterRole === 'patient' ? 'Acceptera inbjudan' : 'Godkänn förfrågan'
  const ctaUrl = `${APP_URL}/logga-in`

  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>{inviterName} har bjudit in dig till Toddy 🐢</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={turtle}>🐢</Text>
            <Heading style={h1}>Du har en inbjudan</Heading>
          </Section>

          <Text style={text}>{intro}</Text>

          <Section style={ctaWrap}>
            <Button style={button} href={ctaUrl}>
              {ctaLabel}
            </Button>
          </Section>

          <Text style={subtle}>
            Logga in på Toddy för att godkänna eller avböja förfrågan. Har du inget konto än
            kan du skapa ett gratis på samma sida.
          </Text>

          <Section style={card}>
            <Text style={cardLabel}>Vad är Toddy?</Text>
            <Text style={cardText}>
              En digital stämningsdagbok byggd specifikt för bipolär sjukdom. Användare loggar
              mående, sömn och mediciner — och kan tryggt dela sin data med vården eller anhöriga.
            </Text>
          </Section>

          <Text style={footer}>
            Väntade du dig inte detta mejl? Då kan du ignorera det — ingen koppling skapas
            förrän du själv godkänner den.
          </Text>
          <Text style={brand}>{SITE_NAME} · stämningsdagbok för bipolär sjukdom</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CareTeamInvitationEmail,
  subject: (data: Record<string, any>) => {
    const name = data?.inviterName || 'Någon'
    return `${name} har bjudit in dig till Toddy`
  },
  displayName: 'Inbjudan till Toddy',
  previewData: {
    inviterName: 'Anna',
    inviterRole: 'patient',
    recipientRole: 'relative',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = {
  padding: '40px 28px',
  maxWidth: '520px',
  margin: '0 auto',
}
const hero = { textAlign: 'center' as const, marginBottom: '24px' }
const turtle = { fontSize: '40px', margin: '0 0 8px', lineHeight: '1' }
const h1 = {
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#0E1626',
  margin: '0',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '16px',
  color: '#3a3f4b',
  lineHeight: '1.6',
  margin: '0 0 28px',
  textAlign: 'center' as const,
}
const ctaWrap = { textAlign: 'center' as const, margin: '0 0 20px' }
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
const subtle = {
  fontSize: '13px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 32px',
  textAlign: 'center' as const,
}
const card = {
  backgroundColor: '#F7F4EC',
  borderRadius: '16px',
  padding: '20px 22px',
  margin: '0 0 32px',
}
const cardLabel = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#8b6f1f',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}
const cardText = {
  fontSize: '14px',
  color: '#3a3f4b',
  lineHeight: '1.6',
  margin: 0,
}
const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: '1.5',
  margin: '0 0 12px',
  textAlign: 'center' as const,
}
const brand = {
  fontSize: '11px',
  color: '#c2c5cb',
  margin: 0,
  textAlign: 'center' as const,
}
