-- Tabell för cachad sentiment- och temaanalys av användarens dagliga kommentarer/tankar.
CREATE TABLE public.thought_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  sentiment numeric NOT NULL DEFAULT 0,
  themes text[] NOT NULL DEFAULT '{}',
  comment_excerpt text,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT thought_analysis_user_date_unique UNIQUE (user_id, date),
  CONSTRAINT thought_analysis_sentiment_range CHECK (sentiment >= -1 AND sentiment <= 1)
);

CREATE INDEX idx_thought_analysis_user_date ON public.thought_analysis (user_id, date DESC);

ALTER TABLE public.thought_analysis ENABLE ROW LEVEL SECURITY;

-- Anon: deny
CREATE POLICY "Deny anon access to thought_analysis"
ON public.thought_analysis FOR SELECT TO anon USING (false);

-- Egen åtkomst
CREATE POLICY "Users can view their own thought analysis"
ON public.thought_analysis FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thought analysis"
ON public.thought_analysis FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Service role hanterar inserts/updates (edge function)
CREATE POLICY "Service role manages thought analysis"
ON public.thought_analysis FOR ALL TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Vårdgivare/anhörig får läsa via befintliga delningsflaggor (share_comments)
CREATE POLICY "Doctors can view connected user thought analysis"
ON public.thought_analysis FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.patient_doctor_connections
  WHERE patient_id = thought_analysis.user_id
    AND doctor_id = auth.uid()
    AND status = 'approved'
    AND share_comments = true
));

CREATE POLICY "Relatives can view connected user thought analysis"
ON public.thought_analysis FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.patient_relative_connections
  WHERE patient_id = thought_analysis.user_id
    AND relative_id = auth.uid()
    AND status = 'approved'
    AND share_comments = true
));