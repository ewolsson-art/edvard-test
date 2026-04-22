CREATE OR REPLACE FUNCTION public.assign_initial_role(_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow patient, relative, and doctor as initial roles
  IF _role NOT IN ('patient', 'relative', 'doctor') THEN
    RETURN false;
  END IF;

  -- Update the role only if it's currently 'patient' (the default)
  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = auth.uid()
    AND role = 'patient';

  RETURN FOUND;
END;
$function$;