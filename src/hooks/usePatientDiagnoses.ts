import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PatientDiagnosis {
  id: string;
  name: string;
  diagnosed_at: string | null;
  created_at: string;
}

interface UsePatientDiagnosesProps {
  patientId: string;
}

export const usePatientDiagnoses = ({ patientId }: UsePatientDiagnosesProps) => {
  const [diagnoses, setDiagnoses] = useState<PatientDiagnosis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnoses = async () => {
      if (!patientId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('diagnoses')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDiagnoses(data || []);
      } catch (error) {
        console.error('Error fetching patient diagnoses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagnoses();
  }, [patientId]);

  return {
    diagnoses,
    isLoading,
  };
};
