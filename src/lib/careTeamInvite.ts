// Shared helper for sending care-team invitation emails (K-2).
// Extracted to remove ~85% duplication across the 3 connection hooks
// (useDoctorConnections, usePatientConnections, useRelativeConnections,
// usePatientRelativeConnections).
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type Role = 'doctor' | 'patient' | 'relative';

interface SendCareTeamInviteParams {
  user: User;
  recipientEmail: string;
  recipientId: string;
  inviterRole: Role;
  recipientRole: Role;
  /** Used as idempotencyKey prefix, e.g. `invite-doctor` or `request-relative`. */
  keyPrefix: string;
  fallbackInviterName?: string;
}

export function sendCareTeamInvite({
  user,
  recipientEmail,
  recipientId,
  inviterRole,
  recipientRole,
  keyPrefix,
  fallbackInviterName = 'En användare',
}: SendCareTeamInviteParams): void {
  const inviterName =
    (user.user_metadata?.first_name as string | undefined) ||
    (user.email?.split('@')[0] ?? fallbackInviterName);

  supabase.functions
    .invoke('send-transactional-email', {
      body: {
        templateName: 'care-team-invitation',
        recipientEmail,
        idempotencyKey: `${keyPrefix}-${user.id}-${recipientId}`,
        templateData: { inviterName, inviterRole, recipientRole },
      },
    })
    .catch((e) => console.warn('[careTeamInvite] failed', e));
}
