-- Add frequency column to medications table
ALTER TABLE public.medications 
ADD COLUMN frequency text NOT NULL DEFAULT 'daily';

-- Add comment to explain valid values
COMMENT ON COLUMN public.medications.frequency IS 'Medication frequency: daily, twice_daily, three_times_daily, weekly, as_needed, other';