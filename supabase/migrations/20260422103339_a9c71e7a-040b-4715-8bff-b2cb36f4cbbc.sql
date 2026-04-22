ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;