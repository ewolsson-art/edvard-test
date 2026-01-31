-- Create a function that returns doctor profile info for connected patients
CREATE OR REPLACE FUNCTION public.get_doctor_profile_for_patient(p_doctor_id uuid, p_patient_id uuid)
RETURNS TABLE(first_name text, last_name text, clinic_name text, hospital_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.first_name, p.last_name, p.clinic_name, p.hospital_name
  FROM public.profiles p
  WHERE p.user_id = p_doctor_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_doctor_connections c
      WHERE c.doctor_id = p_doctor_id
        AND c.patient_id = p_patient_id
    )
$$;