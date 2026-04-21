-- Remove restrictive CHECK constraints that block valid app values
-- The app uses an extended 7-level mood scale and 5-level sleep/eating quality scale
-- but these old CHECK constraints only allow the legacy 5-level mood and 3-level quality values.
-- Validation is enforced in TypeScript types and the app layer instead.

ALTER TABLE public.mood_entries DROP CONSTRAINT IF EXISTS mood_entries_mood_check;
ALTER TABLE public.mood_entries DROP CONSTRAINT IF EXISTS mood_entries_sleep_quality_check;
ALTER TABLE public.mood_entries DROP CONSTRAINT IF EXISTS mood_entries_eating_quality_check;