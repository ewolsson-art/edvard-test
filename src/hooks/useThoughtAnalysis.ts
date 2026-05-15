import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ThoughtAnalysisRow {
  id: string;
  date: string;
  sentiment: number; // -1 .. 1
  themes: string[];
  comment_excerpt: string | null;
  analyzed_at: string;
}

export function useThoughtAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['thought-analysis', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thought_analysis')
        .select('id, date, sentiment, themes, comment_excerpt, analyzed_at')
        .eq('user_id', user!.id)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ThoughtAnalysisRow[];
    },
  });

  const analyze = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-thoughts', { body: {} });
      if (error) throw error;
      return data as { analyzed: number; triggers_found: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thought-analysis', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pattern-insights', user?.id] });
    },
  });

  // 7-day moving average of sentiment trend
  const data = query.data ?? [];
  const lastWeek = data.slice(-7);
  const prevWeek = data.slice(-14, -7);
  const avg = (rows: ThoughtAnalysisRow[]) =>
    rows.length ? rows.reduce((s, r) => s + Number(r.sentiment), 0) / rows.length : 0;
  const trend = avg(lastWeek) - avg(prevWeek);

  return {
    rows: data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    analyze: analyze.mutateAsync,
    isAnalyzing: analyze.isPending,
    trend,
    weekAvg: avg(lastWeek),
  };
}
