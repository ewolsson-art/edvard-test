-- Create a trigger to automatically insert user role from metadata on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from user metadata, default to 'patient' if not set
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  
  -- Insert the role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();