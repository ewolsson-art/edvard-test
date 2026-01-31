-- Create a function to get patient email for doctors with approved connections
CREATE OR REPLACE FUNCTION public.get_patient_email_for_doctor(p_patient_id uuid, p_doctor_id uuid)
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
      FROM public.patient_doctor_connections c
      WHERE c.patient_id = p_patient_id
        AND c.doctor_id = p_doctor_id
        AND c.status IN ('pending', 'approved')
    )
$$;