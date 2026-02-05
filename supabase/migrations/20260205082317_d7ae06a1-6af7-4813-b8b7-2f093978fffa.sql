-- Add explicit deny policies for unauthenticated access on all sensitive tables
-- This ensures that even if RLS is enabled, anonymous users cannot access any data

-- profiles table
CREATE POLICY "Deny public access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- diagnoses table
CREATE POLICY "Deny public access to diagnoses"
ON public.diagnoses FOR SELECT
TO anon
USING (false);

-- medications table
CREATE POLICY "Deny public access to medications"
ON public.medications FOR SELECT
TO anon
USING (false);

-- medication_logs table
CREATE POLICY "Deny public access to medication_logs"
ON public.medication_logs FOR SELECT
TO anon
USING (false);

-- mood_entries table
CREATE POLICY "Deny public access to mood_entries"
ON public.mood_entries FOR SELECT
TO anon
USING (false);

-- characteristics table
CREATE POLICY "Deny public access to characteristics"
ON public.characteristics FOR SELECT
TO anon
USING (false);

-- chat_messages table
CREATE POLICY "Deny public access to chat_messages"
ON public.chat_messages FOR SELECT
TO anon
USING (false);

-- relative_comments table
CREATE POLICY "Deny public access to relative_comments"
ON public.relative_comments FOR SELECT
TO anon
USING (false);

-- patient_doctor_connections table
CREATE POLICY "Deny public access to patient_doctor_connections"
ON public.patient_doctor_connections FOR SELECT
TO anon
USING (false);

-- patient_relative_connections table
CREATE POLICY "Deny public access to patient_relative_connections"
ON public.patient_relative_connections FOR SELECT
TO anon
USING (false);

-- doctor_delegates table
CREATE POLICY "Deny public access to doctor_delegates"
ON public.doctor_delegates FOR SELECT
TO anon
USING (false);

-- notification_preferences table
CREATE POLICY "Deny public access to notification_preferences"
ON public.notification_preferences FOR SELECT
TO anon
USING (false);

-- user_preferences table
CREATE POLICY "Deny public access to user_preferences"
ON public.user_preferences FOR SELECT
TO anon
USING (false);

-- user_roles table
CREATE POLICY "Deny public access to user_roles"
ON public.user_roles FOR SELECT
TO anon
USING (false);

-- shared_reports table
CREATE POLICY "Deny public access to shared_reports"
ON public.shared_reports FOR SELECT
TO anon
USING (false);