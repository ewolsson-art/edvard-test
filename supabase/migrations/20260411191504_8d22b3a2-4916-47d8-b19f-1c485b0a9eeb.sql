ALTER TABLE public.mood_entries DROP CONSTRAINT mood_entries_mood_check;
ALTER TABLE public.mood_entries ADD CONSTRAINT mood_entries_mood_check CHECK (mood = ANY (ARRAY['elevated','somewhat_elevated','stable','somewhat_depressed','depressed']));

ALTER TABLE public.mood_entries DROP CONSTRAINT mood_entries_sleep_quality_check;
ALTER TABLE public.mood_entries ADD CONSTRAINT mood_entries_sleep_quality_check CHECK (sleep_quality IS NULL OR sleep_quality = ANY (ARRAY['good','okay','bad']));

ALTER TABLE public.mood_entries DROP CONSTRAINT mood_entries_eating_quality_check;
ALTER TABLE public.mood_entries ADD CONSTRAINT mood_entries_eating_quality_check CHECK (eating_quality IS NULL OR eating_quality = ANY (ARRAY['good','okay','bad']));