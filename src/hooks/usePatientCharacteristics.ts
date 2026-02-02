import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Characteristic } from './useCharacteristics';

export function usePatientCharacteristics(patientId: string | undefined) {
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setCharacteristics([]);
      setIsLoading(false);
      return;
    }

    const fetchCharacteristics = async () => {
      try {
        const { data, error } = await supabase
          .from('characteristics')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setCharacteristics((data || []) as Characteristic[]);
      } catch (error) {
        console.error('Error fetching patient characteristics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacteristics();
  }, [patientId]);

  const elevatedCharacteristics = characteristics.filter(c => c.mood_type === 'elevated');
  const depressedCharacteristics = characteristics.filter(c => c.mood_type === 'depressed');

  return {
    characteristics,
    elevatedCharacteristics,
    depressedCharacteristics,
    isLoading,
  };
}
