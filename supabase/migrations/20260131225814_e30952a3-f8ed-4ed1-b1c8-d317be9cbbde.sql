-- Create a function to get doctor email for connected patients
CREATE OR REPLACE FUNCTION public.get_doctor_email_for_patient(p_doctor_id uuid, p_patient_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Check if there's an approved connection between patient and doctor
  IF EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_id = p_patient_id
    AND doctor_id = p_doctor_id
    AND status = 'approved'
  ) THEN
    -- Get the doctor's email
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = p_doctor_id;
    
    RETURN v_email;
  END IF;
  
  RETURN NULL;
END;
$$;