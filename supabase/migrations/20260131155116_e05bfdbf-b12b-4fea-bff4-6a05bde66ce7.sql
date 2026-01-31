-- Add clinic and hospital fields to profiles table for doctors
ALTER TABLE public.profiles 
ADD COLUMN clinic_name text,
ADD COLUMN hospital_name text;