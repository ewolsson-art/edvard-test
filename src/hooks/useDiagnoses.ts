import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Diagnosis {
  id: string;
  name: string;
  diagnosed_at: string | null;
  created_at: string;
}

export const useDiagnoses = () => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDiagnoses = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiagnoses(data || []);
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
  }, [user]);

  const addDiagnosis = async (name: string, diagnosedAt?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('diagnoses')
        .insert({
          user_id: user.id,
          name: name.trim(),
          diagnosed_at: diagnosedAt || null,
        });

      if (error) throw error;

      toast({
        title: 'Diagnos tillagd',
        description: `${name} har lagts till.`,
      });

      await fetchDiagnoses();
      return true;
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till diagnos.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeDiagnosis = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('diagnoses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Diagnos borttagen',
      });

      await fetchDiagnoses();
      return true;
    } catch (error) {
      console.error('Error removing diagnosis:', error);
      toast({
        title: 'Fel',
        description: 'Kunde inte ta bort diagnos.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    diagnoses,
    isLoading,
    addDiagnosis,
    removeDiagnosis,
  };
};
