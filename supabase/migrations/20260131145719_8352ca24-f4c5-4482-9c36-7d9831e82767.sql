-- Enable realtime for mood_entries table so doctors can see patient updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_entries;