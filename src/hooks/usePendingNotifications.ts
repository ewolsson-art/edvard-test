import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export function usePendingNotifications() {
  const { user } = useAuth();
  const { isDoctor, isPatient, isRelative, isLoading: roleLoading } = useUserRole();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingCount = useCallback(async () => {
    if (!user || roleLoading) return;

    let count = 0;

    try {
      if (isPatient) {
        // Patient: count pending requests from doctors and relatives
        const [doctorResult, relativeResult] = await Promise.all([
          supabase
            .from('patient_doctor_connections')
            .select('id', { count: 'exact', head: true })
            .eq('patient_id', user.id)
            .eq('status', 'pending')
            .eq('initiated_by', 'doctor'),
          supabase
            .from('patient_relative_connections')
            .select('id', { count: 'exact', head: true })
            .eq('patient_id', user.id)
            .eq('status', 'pending')
            .eq('initiated_by', 'relative'),
        ]);

        count = (doctorResult.count || 0) + (relativeResult.count || 0);
      } else if (isDoctor) {
        // Doctor: count pending requests from patients
        const { count: doctorCount } = await supabase
          .from('patient_doctor_connections')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', user.id)
          .eq('status', 'pending')
          .eq('initiated_by', 'patient');

        count = doctorCount || 0;
      } else if (isRelative) {
        // Relative: count pending requests from patients
        const { count: relativeCount } = await supabase
          .from('patient_relative_connections')
          .select('id', { count: 'exact', head: true })
          .eq('relative_id', user.id)
          .eq('status', 'pending')
          .eq('initiated_by', 'patient');

        count = relativeCount || 0;
      }
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
    }

    setPendingCount(count);
    setIsLoading(false);
  }, [user, isDoctor, isPatient, isRelative, roleLoading]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user || roleLoading) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    if (isPatient) {
      const doctorChannel = supabase
        .channel('patient-doctor-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patient_doctor_connections',
            filter: `patient_id=eq.${user.id}`,
          },
          () => fetchPendingCount()
        )
        .subscribe();

      const relativeChannel = supabase
        .channel('patient-relative-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patient_relative_connections',
            filter: `patient_id=eq.${user.id}`,
          },
          () => fetchPendingCount()
        )
        .subscribe();

      channels.push(doctorChannel, relativeChannel);
    } else if (isDoctor) {
      const channel = supabase
        .channel('doctor-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patient_doctor_connections',
            filter: `doctor_id=eq.${user.id}`,
          },
          () => fetchPendingCount()
        )
        .subscribe();

      channels.push(channel);
    } else if (isRelative) {
      const channel = supabase
        .channel('relative-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patient_relative_connections',
            filter: `relative_id=eq.${user.id}`,
          },
          () => fetchPendingCount()
        )
        .subscribe();

      channels.push(channel);
    }

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user, isDoctor, isPatient, isRelative, roleLoading, fetchPendingCount]);

  return {
    pendingCount,
    hasPending: pendingCount > 0,
    isLoading,
    refetch: fetchPendingCount,
  };
}
