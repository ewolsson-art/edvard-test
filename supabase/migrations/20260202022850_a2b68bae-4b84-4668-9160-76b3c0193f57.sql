-- Create table for relative comments about patient days
CREATE TABLE public.relative_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relative_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  date DATE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(relative_id, patient_id, date)
);

-- Enable RLS
ALTER TABLE public.relative_comments ENABLE ROW LEVEL SECURITY;

-- Relatives can view their own comments
CREATE POLICY "Relatives can view their own comments"
ON public.relative_comments
FOR SELECT
USING (auth.uid() = relative_id);

-- Relatives can create comments for connected patients
CREATE POLICY "Relatives can create comments for connected patients"
ON public.relative_comments
FOR INSERT
WITH CHECK (
  auth.uid() = relative_id AND
  EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_relative_connections.relative_id = auth.uid()
    AND patient_relative_connections.patient_id = relative_comments.patient_id
    AND patient_relative_connections.status = 'approved'
  )
);

-- Relatives can update their own comments
CREATE POLICY "Relatives can update their own comments"
ON public.relative_comments
FOR UPDATE
USING (auth.uid() = relative_id);

-- Relatives can delete their own comments
CREATE POLICY "Relatives can delete their own comments"
ON public.relative_comments
FOR DELETE
USING (auth.uid() = relative_id);

-- Create trigger for updated_at
CREATE TRIGGER update_relative_comments_updated_at
BEFORE UPDATE ON public.relative_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();