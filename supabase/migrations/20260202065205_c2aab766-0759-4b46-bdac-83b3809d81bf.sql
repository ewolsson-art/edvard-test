-- Add share_ai_insights column to patient_doctor_connections
ALTER TABLE public.patient_doctor_connections 
ADD COLUMN share_ai_insights boolean NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.patient_doctor_connections.share_ai_insights IS 'Whether the patient allows their doctor to see AI-generated insights';