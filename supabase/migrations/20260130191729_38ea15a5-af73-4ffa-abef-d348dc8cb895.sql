-- Add started_at column to medications table
ALTER TABLE public.medications 
ADD COLUMN started_at DATE NOT NULL DEFAULT CURRENT_DATE;