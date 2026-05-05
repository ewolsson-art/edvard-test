ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS quick_include_sleep boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quick_include_eating boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quick_include_exercise boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quick_include_medication boolean NOT NULL DEFAULT false;