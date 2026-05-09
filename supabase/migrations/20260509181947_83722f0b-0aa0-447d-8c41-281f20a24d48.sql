CREATE TABLE public.user_learned_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_learned_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to user_learned_insights"
ON public.user_learned_insights FOR SELECT TO anon USING (false);

CREATE POLICY "Users can view their own learned insights"
ON public.user_learned_insights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learned insights"
ON public.user_learned_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learned insights"
ON public.user_learned_insights FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learned insights"
ON public.user_learned_insights FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view connected user learned insights"
ON public.user_learned_insights FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM patient_doctor_connections
  WHERE patient_doctor_connections.patient_id = user_learned_insights.user_id
    AND patient_doctor_connections.doctor_id = auth.uid()
    AND patient_doctor_connections.status = 'approved'
    AND patient_doctor_connections.share_mood = true
));

CREATE POLICY "Relatives can view connected user learned insights"
ON public.user_learned_insights FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM patient_relative_connections
  WHERE patient_relative_connections.patient_id = user_learned_insights.user_id
    AND patient_relative_connections.relative_id = auth.uid()
    AND patient_relative_connections.status = 'approved'
    AND patient_relative_connections.share_mood = true
));

CREATE INDEX idx_user_learned_insights_user_id ON public.user_learned_insights(user_id, created_at DESC);