
CREATE OR REPLACE FUNCTION public.get_patient_id_by_email(patient_email text)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Allow doctors and relatives to look up patient IDs
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('doctor', 'relative')
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
$function$;
