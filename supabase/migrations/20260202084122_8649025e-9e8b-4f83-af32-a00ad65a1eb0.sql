-- Create table for patient characteristics/signs during mood episodes
CREATE TABLE public.characteristics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  mood_type TEXT NOT NULL CHECK (mood_type IN ('elevated', 'depressed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.characteristics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own characteristics" 
ON public.characteristics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characteristics" 
ON public.characteristics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characteristics" 
ON public.characteristics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characteristics" 
ON public.characteristics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Doctors can view connected patient characteristics
CREATE POLICY "Doctors can view connected patient characteristics" 
ON public.characteristics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM patient_doctor_connections
  WHERE patient_doctor_connections.patient_id = characteristics.user_id
  AND patient_doctor_connections.doctor_id = auth.uid()
  AND patient_doctor_connections.status = 'approved'
));

-- Relatives can view connected patient characteristics
CREATE POLICY "Relatives can view connected patient characteristics" 
ON public.characteristics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM patient_relative_connections
  WHERE patient_relative_connections.patient_id = characteristics.user_id
  AND patient_relative_connections.relative_id = auth.uid()
  AND patient_relative_connections.status = 'approved'
));

-- Add index for faster queries
CREATE INDEX idx_characteristics_user_id ON public.characteristics(user_id);
CREATE INDEX idx_characteristics_mood_type ON public.characteristics(mood_type);

COMMENT ON TABLE public.characteristics IS 'Stores patient-defined characteristics/signs for elevated and depressed mood periods';