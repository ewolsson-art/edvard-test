-- Add exercise_types column to mood_entries table
-- This allows users to specify what type of exercise they did (chest, shoulders, back, legs)
ALTER TABLE public.mood_entries 
ADD COLUMN exercise_types text[] DEFAULT NULL;