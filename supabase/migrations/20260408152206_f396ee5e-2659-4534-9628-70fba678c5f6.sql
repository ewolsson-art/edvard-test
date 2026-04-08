
-- Create a secure function for initial role assignment
CREATE OR REPLACE FUNCTION public.assign_initial_role(_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changing to 'relative' (not 'doctor')
  -- Doctor role assignment requires admin action
  IF _role NOT IN ('patient', 'relative') THEN
    RETURN false;
  END IF;

  -- Update the role only if it's currently 'patient' (the default)
  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = auth.uid()
    AND role = 'patient';

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_initial_role FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_initial_role TO authenticated;
