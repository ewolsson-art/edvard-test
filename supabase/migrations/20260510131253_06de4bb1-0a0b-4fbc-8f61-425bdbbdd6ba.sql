ALTER TABLE public.characteristics
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Existerande rader behåller default 'manual'.
-- Tillåtna värden: 'manual' (lagt till själv) eller 'checkin' (registrerat via in-checkning/Ask Toddy)
ALTER TABLE public.characteristics
DROP CONSTRAINT IF EXISTS characteristics_source_check;

ALTER TABLE public.characteristics
ADD CONSTRAINT characteristics_source_check
CHECK (source IN ('manual', 'checkin'));

CREATE INDEX IF NOT EXISTS idx_characteristics_user_source
ON public.characteristics (user_id, source);