-- Create role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create patient_doctor_connections table
CREATE TABLE public.patient_doctor_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  share_mood BOOLEAN NOT NULL DEFAULT true,
  share_sleep BOOLEAN NOT NULL DEFAULT true,
  share_eating BOOLEAN NOT NULL DEFAULT true,
  share_exercise BOOLEAN NOT NULL DEFAULT true,
  share_medication BOOLEAN NOT NULL DEFAULT true,
  share_comments BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (patient_id, doctor_id)
);

-- Enable RLS
ALTER TABLE public.patient_doctor_connections ENABLE ROW LEVEL SECURITY;

-- Patients can view and manage their own connections
CREATE POLICY "Patients can view their connections"
ON public.patient_doctor_connections FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create invitations"
ON public.patient_doctor_connections FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their connections"
ON public.patient_doctor_connections FOR UPDATE
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their connections"
ON public.patient_doctor_connections FOR DELETE
USING (auth.uid() = patient_id);

-- Doctors can view connections where they are invited
CREATE POLICY "Doctors can view their patient connections"
ON public.patient_doctor_connections FOR SELECT
USING (auth.uid() = doctor_id);

-- Doctors can update status (approve/reject)
CREATE POLICY "Doctors can update connection status"
ON public.patient_doctor_connections FOR UPDATE
USING (auth.uid() = doctor_id);

-- Create trigger for updated_at
CREATE TRIGGER update_patient_doctor_connections_updated_at
BEFORE UPDATE ON public.patient_doctor_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policy for doctors to view patient mood_entries (only for approved connections)
CREATE POLICY "Doctors can view connected patient mood entries"
ON public.mood_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections
    WHERE patient_id = mood_entries.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
  )
);

-- RLS policy for doctors to view patient medication_logs
CREATE POLICY "Doctors can view connected patient medication logs"
ON public.medication_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections
    WHERE patient_id = medication_logs.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
  )
);

-- RLS policy for doctors to view patient medications
CREATE POLICY "Doctors can view connected patient medications"
ON public.medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections
    WHERE patient_id = medications.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
  )
);

-- RLS policy for doctors to view patient profiles
CREATE POLICY "Doctors can view connected patient profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections
    WHERE patient_id = profiles.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
  )
);

-- RLS policy for doctors to view patient preferences
CREATE POLICY "Doctors can view connected patient preferences"
ON public.user_preferences FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections
    WHERE patient_id = user_preferences.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
  )
);