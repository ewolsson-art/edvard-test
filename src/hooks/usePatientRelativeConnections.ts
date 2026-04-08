import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface RelativeConnection {
  id: string;
  patient_id: string;
  relative_id: string;
  status: 'pending' | 'approved' | 'rejected';
  initiated_by: 'patient' | 'relative';
  share_mood: boolean;
  share_sleep: boolean;
  share_eating: boolean;
  share_exercise: boolean;
  share_medication: boolean;
  share_comments: boolean;
  share_characteristics: boolean;
  notify_low_mood: boolean;
  created_at: string;
  relative_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  relative_email?: string;
}

export function usePatientRelativeConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<RelativeConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('patient_relative_connections')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Fetch relative profiles for each connection
      const connectionsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          // Fetch profile via secure function
          const { data: profile } = await supabase
            .rpc('get_relative_profile_for_patient', {
              p_relative_id: conn.relative_id,
              p_patient_id: user.id,
            })
            .maybeSingle();

          // Fetch email via RPC function
          const { data: email } = await supabase
            .rpc('get_relative_email_for_patient', {
              p_relative_id: conn.relative_id,
              p_patient_id: user.id,
            });

          return {
            ...conn,
            relative_profile: profile || undefined,
            relative_email: email || undefined,
          } as RelativeConnection;
        })
      );
      setConnections(connectionsWithProfiles);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const inviteRelative = useCallback(async (
    relativeEmail: string,
    shareSettings: {
      share_mood: boolean;
      share_sleep: boolean;
      share_eating: boolean;
      share_exercise: boolean;
      share_medication: boolean;
      share_comments: boolean;
      share_characteristics: boolean;
      notify_low_mood: boolean;
    }
  ) => {
    if (!user) return { success: false, error: 'Inte inloggad' };

    // Find relative by email
    const { data: relativeId, error: relativeError } = await supabase
      .rpc('get_relative_id_by_email', { relative_email: relativeEmail });

    if (relativeError || !relativeId) {
      return { success: false, error: 'Kunde inte hitta anhörig med denna e-post' };
    }

    const { error } = await supabase
      .from('patient_relative_connections')
      .insert({
        patient_id: user.id,
        relative_id: relativeId as string,
        initiated_by: 'patient',
        ...shareSettings,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Du har redan bjudit in denna anhöriga' };
      }
      return { success: false, error: 'Kunde inte skicka inbjudan' };
    }

    toast({ title: "Inbjudan skickad!" });
    await fetchConnections();
    return { success: true };
  }, [user, toast, fetchConnections]);

  const updateShareSettings = useCallback(async (
    connectionId: string,
    settings: Partial<{
      share_mood: boolean;
      share_sleep: boolean;
      share_eating: boolean;
      share_exercise: boolean;
      share_medication: boolean;
      share_comments: boolean;
      share_characteristics: boolean;
      notify_low_mood: boolean;
    }>
  ) => {
    const { error } = await supabase
      .from('patient_relative_connections')
      .update(settings)
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Kunde inte uppdatera",
        variant: "destructive",
      });
      return false;
    }

    setConnections(prev =>
      prev.map(c => c.id === connectionId ? { ...c, ...settings } : c)
    );
    toast({ title: "Inställningar uppdaterade" });
    return true;
  }, [toast]);

  const removeConnection = useCallback(async (connectionId: string) => {
    const { error } = await supabase
      .from('patient_relative_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Kunde inte ta bort",
        variant: "destructive",
      });
      return false;
    }

    setConnections(prev => prev.filter(c => c.id !== connectionId));
    toast({ title: "Koppling borttagen" });
    return true;
  }, [toast]);

  const respondToRequest = useCallback(async (
    connectionId: string,
    approved: boolean,
    shareSettings?: {
      share_mood: boolean;
      share_sleep: boolean;
      share_eating: boolean;
      share_exercise: boolean;
      share_medication: boolean;
      share_comments: boolean;
      share_characteristics: boolean;
    }
  ) => {
    const updateData = approved && shareSettings
      ? { status: 'approved', ...shareSettings }
      : { status: approved ? 'approved' : 'rejected' };

    const { error } = await supabase
      .from('patient_relative_connections')
      .update(updateData)
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Kunde inte uppdatera",
        variant: "destructive",
      });
      return false;
    }

    if (approved) {
      setConnections(prev =>
        prev.map(c => c.id === connectionId ? { ...c, status: 'approved' as const, ...shareSettings } : c)
      );
      toast({ title: "Förfrågan godkänd" });
    } else {
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({ title: "Förfrågan avvisad" });
    }
    return true;
  }, [toast]);

  const pendingFromRelatives = connections.filter(c => c.status === 'pending' && c.initiated_by === 'relative');
  const pendingFromPatient = connections.filter(c => c.status === 'pending' && c.initiated_by === 'patient');
  const approvedConnections = connections.filter(c => c.status === 'approved');

  return {
    connections,
    pendingFromRelatives,
    pendingFromPatient,
    approvedConnections,
    isLoading,
    inviteRelative,
    updateShareSettings,
    removeConnection,
    respondToRequest,
    refetch: fetchConnections,
  };
}
