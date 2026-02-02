import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PatientConnection {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: 'pending' | 'approved' | 'rejected';
  initiated_by: 'patient' | 'doctor';
  share_mood: boolean;
  share_sleep: boolean;
  share_eating: boolean;
  share_exercise: boolean;
  share_medication: boolean;
  share_comments: boolean;
  chat_enabled: boolean;
  created_at: string;
  patient_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  patient_email?: string;
}

export function useDoctorConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<PatientConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('patient_doctor_connections')
      .select('*')
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Fetch patient profiles and emails for each connection
      const connectionsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', conn.patient_id)
            .maybeSingle();

          // Fetch email via RPC function
          const { data: email } = await supabase
            .rpc('get_patient_email_for_doctor', {
              p_patient_id: conn.patient_id,
              p_doctor_id: user.id,
            });

          return {
            ...conn,
            patient_profile: profile || undefined,
            patient_email: email || undefined,
          } as PatientConnection;
        })
      );
      setConnections(connectionsWithProfiles);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const updateConnectionStatus = useCallback(async (connectionId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('patient_doctor_connections')
      .update({ status })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Kunde inte uppdatera",
        description: "Försök igen.",
        variant: "destructive",
      });
      return false;
    }

    setConnections(prev => 
      prev.map(c => c.id === connectionId ? { ...c, status } : c)
    );
    toast({
      title: status === 'approved' ? "Koppling godkänd" : "Koppling avvisad",
    });
    return true;
  }, [toast]);

  const toggleChatEnabled = useCallback(async (connectionId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('patient_doctor_connections')
      .update({ chat_enabled: enabled })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Kunde inte uppdatera",
        description: "Försök igen.",
        variant: "destructive",
      });
      return false;
    }

    setConnections(prev => 
      prev.map(c => c.id === connectionId ? { ...c, chat_enabled: enabled } : c)
    );
    toast({
      title: enabled ? "Chatt aktiverad" : "Chatt inaktiverad",
    });
    return true;
  }, [toast]);

  const requestPatientAccess = useCallback(async (patientEmail: string) => {
    if (!user) return { success: false, error: 'Inte inloggad' };

    // Find patient by email using the database function
    const { data: patientId, error: patientError } = await supabase
      .rpc('get_patient_id_by_email', { patient_email: patientEmail });

    if (patientError || !patientId) {
      return { success: false, error: 'Kunde inte hitta patient med denna e-post' };
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('patient_doctor_connections')
      .select('id')
      .eq('patient_id', patientId)
      .eq('doctor_id', user.id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Du har redan en koppling till denna patient' };
    }

    const { error } = await supabase
      .from('patient_doctor_connections')
      .insert({
        patient_id: patientId as string,
        doctor_id: user.id,
        initiated_by: 'doctor',
        status: 'pending',
      });

    if (error) {
      console.error('Error requesting access:', error);
      return { success: false, error: 'Kunde inte skicka förfrågan' };
    }

    toast({ title: "Förfrågan skickad!" });
    await fetchConnections();
    return { success: true };
  }, [user, toast, fetchConnections]);

  const cancelRequest = useCallback(async (connectionId: string) => {
    const { error } = await supabase
      .from('patient_doctor_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Kunde inte avbryta",
        variant: "destructive",
      });
      return false;
    }

    setConnections(prev => prev.filter(c => c.id !== connectionId));
    toast({ title: "Förfrågan avbruten" });
    return true;
  }, [toast]);

  const approvedConnections = connections.filter(c => c.status === 'approved');
  const pendingConnections = connections.filter(c => c.status === 'pending');
  const pendingFromPatients = pendingConnections.filter(c => c.initiated_by === 'patient');
  const pendingFromDoctor = pendingConnections.filter(c => c.initiated_by === 'doctor');

  return {
    connections,
    approvedConnections,
    pendingConnections,
    pendingFromPatients,
    pendingFromDoctor,
    isLoading,
    updateConnectionStatus,
    toggleChatEnabled,
    requestPatientAccess,
    cancelRequest,
    refetch: fetchConnections,
  };
}
