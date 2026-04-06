-- Add tags column to mood_entries for storing check-in tags like "ångest", "irritabilitet" etc.
ALTER TABLE public.mood_entries ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';