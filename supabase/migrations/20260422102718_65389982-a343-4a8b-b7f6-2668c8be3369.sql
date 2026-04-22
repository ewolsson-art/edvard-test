
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS side_effects text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS effectiveness text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS stopped_at date,
  ADD COLUMN IF NOT EXISTS stop_reason text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Backfill status from existing 'active' field
UPDATE public.medications
SET status = CASE WHEN active = true THEN 'current' ELSE 'previous' END
WHERE status IS NULL OR status = 'current';
