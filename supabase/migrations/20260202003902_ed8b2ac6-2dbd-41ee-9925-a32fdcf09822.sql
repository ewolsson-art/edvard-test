-- Create table for patient-relative connections
CREATE TABLE public.patient_relative_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  relative_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  initiated_by text NOT NULL DEFAULT 'patient' CHECK (initiated_by IN ('patient', 'relative')),
  share_mood boolean NOT NULL DEFAULT true,
  share_sleep boolean NOT NULL DEFAULT true,
  share_eating boolean NOT NULL DEFAULT true,
  share_exercise boolean NOT NULL DEFAULT true,
  share_medication boolean NOT NULL DEFAULT true,
  share_comments boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, relative_id)
);

-- Enable RLS
ALTER TABLE public.patient_relative_connections ENABLE ROW LEVEL SECURITY;

-- Patients can view their relative connections
CREATE POLICY "Patients can view their relative connections"
ON public.patient_relative_connections
FOR SELECT
USING (auth.uid() = patient_id);

-- Patients can create invitations to relatives
CREATE POLICY "Patients can invite relatives"
ON public.patient_relative_connections
FOR INSERT
WITH CHECK (auth.uid() = patient_id AND initiated_by = 'patient');

-- Patients can update their relative connections
CREATE POLICY "Patients can update their relative connections"
ON public.patient_relative_connections
FOR UPDATE
USING (auth.uid() = patient_id);

-- Patients can delete their relative connections
CREATE POLICY "Patients can delete relative connections"
ON public.patient_relative_connections
FOR DELETE
USING (auth.uid() = patient_id);

-- Relatives can view their patient connections
CREATE POLICY "Relatives can view their patient connections"
ON public.patient_relative_connections
FOR SELECT
USING (auth.uid() = relative_id);

-- Relatives can request patient access
CREATE POLICY "Relatives can request patient access"
ON public.patient_relative_connections
FOR INSERT
WITH CHECK (
  auth.uid() = relative_id 
  AND public.has_role(auth.uid(), 'relative')
  AND initiated_by = 'relative'
);

-- Relatives can delete their pending requests
CREATE POLICY "Relatives can delete their pending requests"
ON public.patient_relative_connections
FOR DELETE
USING (
  auth.uid() = relative_id 
  AND status = 'pending'
  AND initiated_by = 'relative'
);

-- Function to get relative ID by email
CREATE OR REPLACE FUNCTION public.get_relative_id_by_email(relative_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  INNER JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.email = relative_email
    AND r.role = 'relative'
  LIMIT 1
$$;

-- Function for relatives to get patient email
CREATE OR REPLACE FUNCTION public.get_patient_email_for_relative(p_patient_id uuid, p_relative_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM auth.users u
  WHERE u.id = p_patient_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_relative_connections c
      WHERE c.patient_id = p_patient_id
        AND c.relative_id = p_relative_id
    )
$$;

-- Function for patients to get relative email
CREATE OR REPLACE FUNCTION public.get_relative_email_for_patient(p_relative_id uuid, p_patient_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM auth.users u
  WHERE u.id = p_relative_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_relative_connections c
      WHERE c.relative_id = p_relative_id
        AND c.patient_id = p_patient_id
    )
$$;

-- Function to get relative profile for patient
CREATE OR REPLACE FUNCTION public.get_relative_profile_for_patient(p_relative_id uuid, p_patient_id uuid)
RETURNS TABLE(first_name text, last_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.first_name, p.last_name
  FROM public.profiles p
  WHERE p.user_id = p_relative_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_relative_connections c
      WHERE c.relative_id = p_relative_id
        AND c.patient_id = p_patient_id
    )
$$;

-- Relatives can view connected patient profiles
CREATE POLICY "Relatives can view connected patient profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = profiles.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- Relatives can view connected patient mood entries
CREATE POLICY "Relatives can view connected patient mood entries"
ON public.mood_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = mood_entries.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- Relatives can view connected patient medications
CREATE POLICY "Relatives can view connected patient medications"
ON public.medications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = medications.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- Relatives can view connected patient medication logs
CREATE POLICY "Relatives can view connected patient medication logs"
ON public.medication_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = medication_logs.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- Relatives can view connected patient diagnoses
CREATE POLICY "Relatives can view connected patient diagnoses"
ON public.diagnoses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = diagnoses.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- Relatives can view connected patient preferences
CREATE POLICY "Relatives can view connected patient preferences"
ON public.user_preferences
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = user_preferences.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_patient_relative_connections_updated_at
BEFORE UPDATE ON public.patient_relative_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();