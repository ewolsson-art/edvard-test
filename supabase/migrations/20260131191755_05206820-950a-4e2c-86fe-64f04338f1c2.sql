-- Add medication side effects and comment columns to mood_entries
ALTER TABLE public.mood_entries 
ADD COLUMN IF NOT EXISTS medication_comment TEXT,
ADD COLUMN IF NOT EXISTS medication_side_effects TEXT[];