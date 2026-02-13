
-- Fix get_doctor_id_by_email: only patients should look up doctors
CREATE OR REPLACE FUNCTION public.get_doctor_id_by_email(doctor_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only allow patients to look up doctor IDs
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'patient'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  INNER JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.email = doctor_email
    AND r.role = 'doctor'
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

-- Fix get_patient_id_by_email: only doctors should look up patients
CREATE OR REPLACE FUNCTION public.get_patient_id_by_email(patient_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only allow doctors to look up patient IDs
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'doctor'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  INNER JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.email = patient_email
    AND r.role = 'patient'
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

-- Fix get_relative_id_by_email: only patients should look up relatives
CREATE OR REPLACE FUNCTION public.get_relative_id_by_email(relative_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only allow patients to look up relative IDs
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'patient'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  INNER JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.email = relative_email
    AND r.role = 'relative'
  LIMIT 1;

  RETURN v_user_id;
END;
$$;
