-- Create function to get patient ID by email (for doctors to send access requests)
CREATE OR REPLACE FUNCTION public.get_patient_id_by_email(patient_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  INNER JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.email = patient_email
    AND r.role = 'patient'
  LIMIT 1
$$;

-- Create function for doctors to get patient email for their pending requests
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
    )
$$;