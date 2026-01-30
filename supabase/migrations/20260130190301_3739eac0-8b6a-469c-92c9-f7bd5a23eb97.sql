-- Create medications table to store user's medications
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_logs table to track daily medication intake
CREATE TABLE public.medication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  taken BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, medication_id, date)
);

-- Enable RLS on both tables
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for medications
CREATE POLICY "Users can view their own medications" 
ON public.medications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medications" 
ON public.medications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" 
ON public.medications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" 
ON public.medications FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for medication_logs
CREATE POLICY "Users can view their own medication logs" 
ON public.medication_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medication logs" 
ON public.medication_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication logs" 
ON public.medication_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication logs" 
ON public.medication_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger for medications
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();