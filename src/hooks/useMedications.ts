import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Medication, MedicationLog, MedicationFrequency, MedicationStatus, MedicationEffectiveness } from '@/types/medication';
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
  return (data as any[]).map(m => ({
    ...m,
    side_effects: m.side_effects ?? [],
    status: m.status ?? (m.active ? 'current' : 'previous'),
  })) as Medication[];
}

async function fetchMedicationLogs(userId: string): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as MedicationLog[];
}

export interface AddMedicationInput {
  name: string;
  dosage: string;
  startedAt: string;
  frequency?: MedicationFrequency;
  status?: MedicationStatus;
  sideEffects?: string[];
  effectiveness?: MedicationEffectiveness | null;
  notes?: string | null;
  stoppedAt?: string | null;
  stopReason?: string | null;
  isTrial?: boolean;
  indication?: string | null;
}

export interface UpdateMedicationInput extends AddMedicationInput {}

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

  const addMedication = useCallback(async (
    nameOrInput: string | AddMedicationInput,
    dosage?: string,
    startedAt?: string,
    frequency: MedicationFrequency = 'daily'
  ) => {
    if (!user) return;
    const input: AddMedicationInput = typeof nameOrInput === 'string'
      ? { name: nameOrInput, dosage: dosage!, startedAt: startedAt!, frequency }
      : nameOrInput;

    const status = input.status ?? 'current';
    const payload: any = {
      user_id: user.id,
      name: input.name,
      dosage: input.dosage,
      started_at: input.startedAt,
      frequency: input.frequency ?? 'daily',
      status,
      active: status === 'current',
      side_effects: input.sideEffects ?? [],
      effectiveness: input.effectiveness ?? null,
      notes: input.notes ?? null,
      stopped_at: input.stoppedAt ?? null,
      stop_reason: input.stopReason ?? null,
      is_trial: input.isTrial ?? false,
      indication: input.indication ?? null,
    };

    const { data, error } = await supabase
      .from('medications')
      .insert(payload)
      .select()
      .single();
    if (error) {
      toast({ title: "Kunde inte lägga till medicin", description: "Försök igen.", variant: "destructive" });
    } else {
      setMedications(prev => [...prev, { ...(data as any), side_effects: (data as any).side_effects ?? [] } as Medication]);
      toast({ title: "Medicin tillagd", description: `${input.name} har lagts till.` });
    }
  }, [user, toast, setMedications]);

  const updateMedication = useCallback(async (
    id: string,
    nameOrInput: string | UpdateMedicationInput,
    dosage?: string,
    startedAt?: string,
    frequency: MedicationFrequency = 'daily'
  ) => {
    if (!user) return;
    const input: UpdateMedicationInput = typeof nameOrInput === 'string'
      ? { name: nameOrInput, dosage: dosage!, startedAt: startedAt!, frequency }
      : nameOrInput;

    const updates: any = {
      name: input.name,
      dosage: input.dosage,
      started_at: input.startedAt,
      frequency: input.frequency ?? 'daily',
    };
    if (input.status !== undefined) {
      updates.status = input.status;
      updates.active = input.status === 'current';
    }
    if (input.sideEffects !== undefined) updates.side_effects = input.sideEffects;
    if (input.effectiveness !== undefined) updates.effectiveness = input.effectiveness;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.stoppedAt !== undefined) updates.stopped_at = input.stoppedAt;
    if (input.stopReason !== undefined) updates.stop_reason = input.stopReason;
    if (input.isTrial !== undefined) updates.is_trial = input.isTrial;
    if (input.indication !== undefined) updates.indication = input.indication;

    const { error } = await supabase
      .from('medications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: "Kunde inte uppdatera medicin", variant: "destructive" });
    } else {
      setMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } as Medication : m));
      toast({ title: "Medicin uppdaterad" });
    }
  }, [user, toast, setMedications]);

  const setMedicationStatus = useCallback(async (id: string, status: MedicationStatus, stopReason?: string) => {
    if (!user) return;
    const updates: any = {
      status,
      active: status === 'current',
    };
    if (status === 'previous') {
      updates.stopped_at = new Date().toISOString().slice(0, 10);
      if (stopReason !== undefined) updates.stop_reason = stopReason;
    } else if (status === 'current') {
      updates.stopped_at = null;
      updates.stop_reason = null;
    }
    const { error } = await supabase
      .from('medications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) {
      setMedications(prev => prev.map(m => m.id === id ? { ...m, ...updates } as Medication : m));
    }
  }, [user, setMedications]);

  const toggleMedicationActive = useCallback(async (id: string, active: boolean) => {
    await setMedicationStatus(id, active ? 'current' : 'previous');
  }, [setMedicationStatus]);

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

  // Filter by status (preferred) with fallback to active flag.
  // Legacy 'paused' rows are treated as current so they remain visible after the status was removed.
  const isCurrentStatus = (m: Medication) => {
    const s = (m.status as string) ?? (m.active ? 'current' : 'previous');
    return s !== 'previous';
  };
  const currentMedications = medications.filter(m => isCurrentStatus(m) && m.frequency !== 'as_needed');
  const asNeededMedications = medications.filter(m => isCurrentStatus(m) && m.frequency === 'as_needed');
  const previousMedications = medications.filter(m => !isCurrentStatus(m));

  // Backwards compat aliases
  const activeMedications = currentMedications;
  const inactiveMedications = previousMedications;

  return {
    medications,
    currentMedications,
    activeMedications,
    asNeededMedications,
    previousMedications,
    inactiveMedications,
    logs,
    isLoaded,
    addMedication,
    updateMedication,
    setMedicationStatus,
    toggleMedicationActive,
    deleteMedication,
    logMedication,
    getLogsForDate,
    getMedicationsTakenOnDate,
    isMedicationTakenOnDate,
  };
}
