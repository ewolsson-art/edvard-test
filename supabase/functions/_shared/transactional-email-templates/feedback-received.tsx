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
import type { TemplateEntry } from './registry.ts'

interface FeedbackReceivedProps {
  message?: string
  userEmail?: string
  userName?: string
  category?: string
}

const FeedbackReceivedEmail = ({
  message = '',
  userEmail = 'okänd',
  userName,
  category,
}: FeedbackReceivedProps) => {
  return (
    <Html lang="sv" dir="ltr">
      <Head />
      <Preview>Ny feedback från {userName || userEmail}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={turtle}>🐢</Text>
            <Heading style={h1}>Ny feedback i Toddy</Heading>
          </Section>

          <Section style={card}>
            <Text style={label}>Meddelande</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={metaCard}>
            <Text style={metaRow}><span style={metaLabel}>Från:</span> {userName || '—'}</Text>
            <Text style={metaRow}><span style={metaLabel}>E-post:</span> {userEmail}</Text>
            {category ? (
              <Text style={metaRow}><span style={metaLabel}>Kategori:</span> {category}</Text>
            ) : null}
          </Section>

          <Text style={footer}>
            Skickat automatiskt från Toddy · Du kan se all feedback i adminpanelen.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FeedbackReceivedEmail,
  subject: (data: Record<string, any>) => {
    const who = data?.userName || data?.userEmail || 'någon'
    return `Ny feedback från ${who}`
  },
  to: 'ewolsson@gmail.com',
  displayName: 'Feedback mottagen',
  previewData: {
    message: 'Skulle vara fint om appen kunde påminna mig på morgnar.',
    userEmail: 'test@example.com',
    userName: 'Anna',
    category: 'Idé',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = { padding: '40px 28px', maxWidth: '520px', margin: '0 auto' }
const hero = { textAlign: 'center' as const, marginBottom: '24px' }
const turtle = { fontSize: '40px', margin: '0 0 8px', lineHeight: '1' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0E1626',
  margin: '0',
  letterSpacing: '-0.01em',
}
const card = {
  backgroundColor: '#F7F4EC',
  borderRadius: '16px',
  padding: '20px 22px',
  margin: '0 0 16px',
}
const label = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#8b6f1f',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 8px',
}
const messageText = {
  fontSize: '15px',
  color: '#1f242f',
  lineHeight: '1.6',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
}
const metaCard = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '14px 18px',
  margin: '0 0 24px',
}
const metaRow = { fontSize: '13px', color: '#3a3f4b', lineHeight: '1.6', margin: '2px 0' }
const metaLabel = { color: '#6b7280', fontWeight: 600 as const, marginRight: '6px' }
const footer = {
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
}
