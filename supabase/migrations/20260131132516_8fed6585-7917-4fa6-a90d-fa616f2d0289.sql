-- Function to get doctor user id by email (only returns if user has doctor role)
CREATE OR REPLACE FUNCTION public.get_doctor_id_by_email(doctor_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  INNER JOIN public.user_roles r ON r.user_id = u.id
  WHERE u.email = doctor_email
    AND r.role = 'doctor'
  LIMIT 1
$$;