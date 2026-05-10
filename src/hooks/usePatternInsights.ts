import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type PatternType =
  | 'transition'
  | 'trigger'
  | 'cycle'
  | 'seasonal'
  | 'recovery'
  | 'medication'
  | 'characteristic_chain'
  | 'general';

export type PatternSeverity = 'info' | 'attention' | 'warning';

export interface PatternInsight {
  id: string;
  pattern_type: PatternType;
  title: string;
  description: string;
  confidence: number;
  severity: PatternSeverity;
  supporting_dates: string[];
  occurrences: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface PatternAnalysisRun {
  last_run_at: string;
  entries_analyzed: number;
  patterns_found: number;
  status: 'success' | 'error' | 'insufficient_data';
  error_message: string | null;
}

export function usePatternInsights() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const insightsQuery = useQuery({
    queryKey: ['pattern-insights', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pattern_insights')
        .select('*')
        .eq('user_id', user!.id)
        .order('confidence', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PatternInsight[];
    },
  });

  const lastRunQuery = useQuery({
    queryKey: ['pattern-analysis-run', user?.id],
    enabled: !!user?.id,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pattern_analysis_runs')
        .select('last_run_at, entries_analyzed, patterns_found, status, error_message')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as PatternAnalysisRun | null;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (force = false) => {
      const { data, error } = await supabase.functions.invoke('analyze-patterns', {
        body: { force },
      });
      if (error) throw error;
      return data as {
        status: string;
        patterns_found?: number;
        entries_analyzed?: number;
        entries?: number;
        required?: number;
        ageHours?: number;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pattern-insights', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pattern-analysis-run', user?.id] });
    },
  });

  return {
    insights: insightsQuery.data ?? [],
    lastRun: lastRunQuery.data,
    isLoading: insightsQuery.isLoading || lastRunQuery.isLoading,
    analyze: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    analyzeError: analyzeMutation.error,
  };
}
