-- Add new check-in fields to mood_entries
ALTER TABLE public.mood_entries 
ADD COLUMN sleep_quality text,
ADD COLUMN sleep_comment text,
ADD COLUMN eating_quality text,
ADD COLUMN eating_comment text,
ADD COLUMN exercised boolean,
ADD COLUMN exercise_comment text;

-- Add check constraint for sleep_quality
ALTER TABLE public.mood_entries 
ADD CONSTRAINT mood_entries_sleep_quality_check 
CHECK (sleep_quality IS NULL OR sleep_quality IN ('good', 'bad'));

-- Add check constraint for eating_quality
ALTER TABLE public.mood_entries 
ADD CONSTRAINT mood_entries_eating_quality_check 
CHECK (eating_quality IS NULL OR eating_quality IN ('good', 'bad'));