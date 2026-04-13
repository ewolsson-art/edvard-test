import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Medication, MedicationLog, MedicationFrequency } from '@/types/medication';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const MEDICATIONS_KEY = 'medications';
const MEDICATION_LOGS_KEY = 'medication-logs';

async function fetchMedications(userId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Medication[];
}

async function fetchMedicationLogs(userId: string): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as MedicationLog[];
}

export function useMedications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medications = [], isSuccess: medsSuccess } = useQuery({
    queryKey: [MEDICATIONS_KEY, user?.id],
    queryFn: () => fetchMedications(user!.id),
    enabled: !!user,
  });

  const { data: logs = [], isSuccess: logsSuccess } = useQuery({
    queryKey: [MEDICATION_LOGS_KEY, user?.id],
    queryFn: () => fetchMedicationLogs(user!.id),
    enabled: !!user,
  });

  const isLoaded = !user || (medsSuccess && logsSuccess);

  const setMedications = useCallback(
    (updater: (prev: Medication[]) => Medication[]) => {
      queryClient.setQueryData<Medication[]>([MEDICATIONS_KEY, user?.id], old => updater(old || []));
    },
    [queryClient, user?.id]
  );

  const setLogs = useCallback(
    (updater: (prev: MedicationLog[]) => MedicationLog[]) => {
      queryClient.setQueryData<MedicationLog[]>([MEDICATION_LOGS_KEY, user?.id], old => updater(old || []));
    },
    [queryClient, user?.id]
  );

  const addMedication = useCallback(async (name: string, dosage: string, startedAt: string, frequency: MedicationFrequency = 'daily') => {
    if (!user) return;
    const { data, error } = await supabase
      .from('medications')
      .insert({ user_id: user.id, name, dosage, started_at: startedAt, frequency })
      .select()
      .single();
    if (error) {
      toast({ title: "Kunde inte lägga till medicin", description: "Försök igen.", variant: "destructive" });
    } else {
      setMedications(prev => [...prev, data as Medication]);
      toast({ title: "Medicin tillagd", description: `${name} har lagts till.` });
    }
  }, [user, toast, setMedications]);

  const updateMedication = useCallback(async (id: string, name: string, dosage: string, startedAt: string, frequency: MedicationFrequency = 'daily') => {
    if (!user) return;
    const { error } = await supabase
      .from('medications')
      .update({ name, dosage, started_at: startedAt, frequency })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: "Kunde inte uppdatera medicin", variant: "destructive" });
    } else {
      setMedications(prev => prev.map(m => m.id === id ? { ...m, name, dosage, started_at: startedAt, frequency } : m));
      toast({ title: "Medicin uppdaterad" });
    }
  }, [user, toast, setMedications]);

  const toggleMedicationActive = useCallback(async (id: string, active: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from('medications')
      .update({ active })
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      setMedications(prev => prev.map(m => m.id === id ? { ...m, active } : m));
    }
  }, [user, setMedications]);

  const deleteMedication = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: "Kunde inte ta bort medicin", variant: "destructive" });
    } else {
      setMedications(prev => prev.filter(m => m.id !== id));
      setLogs(prev => prev.filter(l => l.medication_id !== id));
      toast({ title: "Medicin borttagen" });
    }
  }, [user, toast, setMedications, setLogs]);

  const logMedication = useCallback(async (medicationId: string, date: string, taken: boolean) => {
    if (!user) return;
    if (taken) {
      const { data, error } = await supabase
        .from('medication_logs')
        .upsert({ user_id: user.id, medication_id: medicationId, date, taken: true }, { onConflict: 'user_id,medication_id,date' })
        .select()
        .single();
      if (!error) {
        setLogs(prev => {
          const filtered = prev.filter(l => !(l.medication_id === medicationId && l.date === date));
          return [...filtered, data as MedicationLog];
        });
      }
    } else {
      const { error } = await supabase
        .from('medication_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('medication_id', medicationId)
        .eq('date', date);
      if (!error) {
        setLogs(prev => prev.filter(l => !(l.medication_id === medicationId && l.date === date)));
      }
    }
  }, [user, setLogs]);

  const getLogsForDate = useCallback((date: string): MedicationLog[] => {
    return logs.filter(l => l.date === date);
  }, [logs]);

  const getMedicationsTakenOnDate = useCallback((date: string): Medication[] => {
    const dateLogs = getLogsForDate(date);
    const medicationIds = dateLogs.map(l => l.medication_id);
    return medications.filter(m => medicationIds.includes(m.id));
  }, [logs, medications, getLogsForDate]);

  const isMedicationTakenOnDate = useCallback((medicationId: string, date: string): boolean => {
    return logs.some(l => l.medication_id === medicationId && l.date === date);
  }, [logs]);

  const activeMedications = medications.filter(m => m.active && m.frequency !== 'as_needed');
  const asNeededMedications = medications.filter(m => m.active && m.frequency === 'as_needed');
  const inactiveMedications = medications.filter(m => !m.active);

  return {
    medications,
    activeMedications,
    asNeededMedications,
    inactiveMedications,
    logs,
    isLoaded,
    addMedication,
    updateMedication,
    toggleMedicationActive,
    deleteMedication,
    logMedication,
    getLogsForDate,
    getMedicationsTakenOnDate,
    isMedicationTakenOnDate,
  };
}
