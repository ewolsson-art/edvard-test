-- Add share_characteristics column to patient_relative_connections
ALTER TABLE public.patient_relative_connections 
ADD COLUMN share_characteristics boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.patient_relative_connections.share_characteristics IS 'Whether the patient allows their relative to see their characteristics';