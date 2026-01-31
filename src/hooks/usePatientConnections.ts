import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface DoctorConnection {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: 'pending' | 'approved' | 'rejected';
  share_mood: boolean;
  share_sleep: boolean;
  share_eating: boolean;
  share_exercise: boolean;
  share_medication: boolean;
  share_comments: boolean;
  created_at: string;
  doctor_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export function usePatientConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('patient_doctor_connections')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Fetch doctor profiles for each connection
      const connectionsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', conn.doctor_id)
            .maybeSingle();

          return {
            ...conn,
            doctor_profile: profile || undefined,
          } as DoctorConnection;
        })
      );
      setConnections(connectionsWithProfiles);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const inviteDoctor = useCallback(async (
    doctorEmail: string,
    shareSettings: {
      share_mood: boolean;
      share_sleep: boolean;
      share_eating: boolean;
      share_exercise: boolean;
      share_medication: boolean;
      share_comments: boolean;
    }
  ) => {
    if (!user) return { success: false, error: 'Inte inloggad' };

    // Find doctor by email using the database function
    const { data: doctorId, error: doctorError } = await supabase
      .rpc('get_doctor_id_by_email', { doctor_email: doctorEmail });

    if (doctorError || !doctorId) {
      return { success: false, error: 'Kunde inte hitta läkare med denna e-post' };
    }

    const { error } = await supabase
      .from('patient_doctor_connections')
      .insert({
        patient_id: user.id,
        doctor_id: doctorId as string,
        share_mood: shareSettings.share_mood,
        share_sleep: shareSettings.share_sleep,
        share_eating: shareSettings.share_eating,
        share_exercise: shareSettings.share_exercise,
        share_medication: shareSettings.share_medication,
        share_comments: shareSettings.share_comments,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Du har redan bjudit in denna läkare' };
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
    }>
  ) => {
    const { error } = await supabase
      .from('patient_doctor_connections')
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
      .from('patient_doctor_connections')
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

  return {
    connections,
    isLoading,
    inviteDoctor,
    updateShareSettings,
    removeConnection,
    refetch: fetchConnections,
  };
}
