import { useState, useEffect, useCallback } from 'react';
import { Medication, MedicationLog } from '@/types/medication';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch medications and logs
  useEffect(() => {
    if (!user) {
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('medication_logs')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (medsResult.error) {
        console.error('Error fetching medications:', medsResult.error);
      } else {
        setMedications(medsResult.data as Medication[]);
      }

      if (logsResult.error) {
        console.error('Error fetching medication logs:', logsResult.error);
      } else {
        setLogs(logsResult.data as MedicationLog[]);
      }

      setIsLoaded(true);
    };

    fetchData();
  }, [user]);

  const addMedication = useCallback(async (name: string, dosage: string, startedAt: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('medications')
      .insert({
        user_id: user.id,
        name,
        dosage,
        started_at: startedAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding medication:', error);
      toast({
        title: "Kunde inte lägga till medicin",
        description: "Försök igen.",
        variant: "destructive",
      });
    } else {
      setMedications(prev => [...prev, data as Medication]);
      toast({
        title: "Medicin tillagd",
        description: `${name} har lagts till.`,
      });
    }
  }, [user, toast]);

  const updateMedication = useCallback(async (id: string, name: string, dosage: string, startedAt: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('medications')
      .update({ name, dosage, started_at: startedAt })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating medication:', error);
      toast({
        title: "Kunde inte uppdatera medicin",
        variant: "destructive",
      });
    } else {
      setMedications(prev => prev.map(m => 
        m.id === id ? { ...m, name, dosage, started_at: startedAt } : m
      ));
      toast({ title: "Medicin uppdaterad" });
    }
  }, [user, toast]);

  const toggleMedicationActive = useCallback(async (id: string, active: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('medications')
      .update({ active })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling medication:', error);
    } else {
      setMedications(prev => prev.map(m => 
        m.id === id ? { ...m, active } : m
      ));
    }
  }, [user]);

  const deleteMedication = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting medication:', error);
      toast({
        title: "Kunde inte ta bort medicin",
        variant: "destructive",
      });
    } else {
      setMedications(prev => prev.filter(m => m.id !== id));
      setLogs(prev => prev.filter(l => l.medication_id !== id));
      toast({ title: "Medicin borttagen" });
    }
  }, [user, toast]);

  const logMedication = useCallback(async (medicationId: string, date: string, taken: boolean) => {
    if (!user) return;

    if (taken) {
      const { data, error } = await supabase
        .from('medication_logs')
        .upsert({
          user_id: user.id,
          medication_id: medicationId,
          date,
          taken: true,
        }, {
          onConflict: 'user_id,medication_id,date'
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging medication:', error);
      } else {
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

      if (error) {
        console.error('Error removing medication log:', error);
      } else {
        setLogs(prev => prev.filter(l => !(l.medication_id === medicationId && l.date === date)));
      }
    }
  }, [user]);

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

  const activeMedications = medications.filter(m => m.active);

  return {
    medications,
    activeMedications,
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
