-- Create diagnoses table
CREATE TABLE public.diagnoses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  diagnosed_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own diagnoses
CREATE POLICY "Users can view their own diagnoses"
ON public.diagnoses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnoses"
ON public.diagnoses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnoses"
ON public.diagnoses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnoses"
ON public.diagnoses FOR DELETE
USING (auth.uid() = user_id);

-- Doctors can view connected patient diagnoses
CREATE POLICY "Doctors can view connected patient diagnoses"
ON public.diagnoses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_doctor_connections.patient_id = diagnoses.user_id
    AND patient_doctor_connections.doctor_id = auth.uid()
    AND patient_doctor_connections.status = 'approved'
  )
);