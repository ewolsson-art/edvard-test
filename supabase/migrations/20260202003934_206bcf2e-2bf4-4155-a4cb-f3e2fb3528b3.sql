-- Update the handle_new_user_role function to assign role based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  selected_role text;
BEGIN
  -- Get the role from user metadata, default to 'patient'
  selected_role := NEW.raw_user_meta_data->>'role';
  
  -- Only allow valid roles, default to patient for security
  IF selected_role = 'doctor' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor'::app_role)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF selected_role = 'relative' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'relative'::app_role)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    -- Default to patient for any unrecognized or missing role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient'::app_role)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;