import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PatternInsight, PatternAnalysisRun } from './usePatternInsights';

/**
 * Read-only pattern insights for a connected patient (doctor / relative view).
 * RLS already restricts visibility to approved connections with share_ai_insights = true (doctor)
 * or share_mood = true (relative).
 */
export function usePatientPatternInsights(patientId: string | null | undefined) {
  const insightsQuery = useQuery({
    queryKey: ['patient-pattern-insights', patientId],
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pattern_insights')
        .select('*')
        .eq('user_id', patientId!)
        .order('confidence', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PatternInsight[];
    },
  });

  const lastRunQuery = useQuery({
    queryKey: ['patient-pattern-analysis-run', patientId],
    enabled: !!patientId,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pattern_analysis_runs')
        .select('last_run_at, entries_analyzed, patterns_found, status, error_message')
        .eq('user_id', patientId!)
        .maybeSingle();
      if (error) throw error;
      return data as PatternAnalysisRun | null;
    },
  });

  return {
    insights: insightsQuery.data ?? [],
    lastRun: lastRunQuery.data,
    isLoading: insightsQuery.isLoading || lastRunQuery.isLoading,
  };
}
