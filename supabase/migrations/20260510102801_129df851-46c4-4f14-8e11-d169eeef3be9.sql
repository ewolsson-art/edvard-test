-- Tabell för upptäckta personliga mönster över historiken
CREATE TABLE public.pattern_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'transition' | 'trigger' | 'cycle' | 'seasonal' | 'recovery' | 'medication' | 'characteristic_chain' | 'general'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5, -- 0.00 - 1.00
  severity TEXT NOT NULL DEFAULT 'info', -- 'info' | 'attention' | 'warning'
  supporting_dates DATE[] DEFAULT '{}',
  supporting_data JSONB DEFAULT '{}'::jsonb,
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen_at DATE,
  last_seen_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pattern_insights_user_id ON public.pattern_insights(user_id);
CREATE INDEX idx_pattern_insights_created_at ON public.pattern_insights(created_at DESC);

ALTER TABLE public.pattern_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to pattern_insights"
  ON public.pattern_insights FOR SELECT TO anon USING (false);

CREATE POLICY "Users can view their own pattern insights"
  ON public.pattern_insights FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pattern insights"
  ON public.pattern_insights FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view connected user pattern insights"
  ON public.pattern_insights FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_id = pattern_insights.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
      AND share_ai_insights = true
  ));

CREATE POLICY "Relatives can view connected user pattern insights"
  ON public.pattern_insights FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_id = pattern_insights.user_id
      AND relative_id = auth.uid()
      AND status = 'approved'
      AND share_mood = true
  ));

-- Service role kan göra allt (edge function använder service role)
CREATE POLICY "Service role manages pattern insights"
  ON public.pattern_insights FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_pattern_insights_updated_at
  BEFORE UPDATE ON public.pattern_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Logg-tabell för att veta när vi senast körde analys (för caching)
CREATE TABLE public.pattern_analysis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entries_analyzed INTEGER NOT NULL DEFAULT 0,
  patterns_found INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'error' | 'insufficient_data'
  error_message TEXT
);

ALTER TABLE public.pattern_analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis runs"
  ON public.pattern_analysis_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages analysis runs"
  ON public.pattern_analysis_runs FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');