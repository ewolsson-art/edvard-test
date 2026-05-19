/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as careTeamInvitation } from './care-team-invitation.tsx'
import { template as feedbackReceived } from './feedback-received.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'care-team-invitation': careTeamInvitation,
  'feedback-received': feedbackReceived,
}
