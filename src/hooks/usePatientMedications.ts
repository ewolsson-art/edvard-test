import { useState, useEffect, useCallback } from 'react';
import { Medication, MedicationLog } from '@/types/medication';
import { supabase } from '@/integrations/supabase/client';

interface UsePatientMedicationsOptions {
  patientId: string;
}

export function usePatientMedications({ patientId }: UsePatientMedicationsOptions) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setMedications([]);
      setLogs([]);
      setIsLoaded(true);
      return;
    }

    const fetchData = async () => {
      const [medsResult, logsResult] = await Promise.all([
        supabase
          .from('medications')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: true }),
        supabase
          .from('medication_logs')
          .select('*')
          .eq('user_id', patientId)
      ]);

      if (medsResult.error) {
        console.error('Error fetching patient medications:', medsResult.error);
      } else {
        setMedications(medsResult.data as Medication[]);
      }

      if (logsResult.error) {
        console.error('Error fetching patient medication logs:', logsResult.error);
      } else {
        setLogs(logsResult.data as MedicationLog[]);
      }

      setIsLoaded(true);
    };

    fetchData();
  }, [patientId]);

  const activeMedications = medications.filter(m => m.active);
  const inactiveMedications = medications.filter(m => !m.active);

  const getLogsForDate = useCallback((date: string): MedicationLog[] => {
    return logs.filter(l => l.date === date);
  }, [logs]);

  const isMedicationTakenOnDate = useCallback((medicationId: string, date: string): boolean => {
    return logs.some(l => l.medication_id === medicationId && l.date === date);
  }, [logs]);

  return {
    medications,
    activeMedications,
    inactiveMedications,
    logs,
    isLoaded,
    getLogsForDate,
    isMedicationTakenOnDate,
  };
}
