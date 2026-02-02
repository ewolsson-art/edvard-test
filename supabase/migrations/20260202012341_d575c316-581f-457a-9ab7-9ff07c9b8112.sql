-- Fix RPC functions to require approved status for email/profile disclosure

-- Fix get_doctor_profile_for_patient to require approved status
CREATE OR REPLACE FUNCTION public.get_doctor_profile_for_patient(p_doctor_id uuid, p_patient_id uuid)
 RETURNS TABLE(first_name text, last_name text, clinic_name text, hospital_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.first_name, p.last_name, p.clinic_name, p.hospital_name
  FROM public.profiles p
  WHERE p.user_id = p_doctor_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_doctor_connections c
      WHERE c.doctor_id = p_doctor_id
        AND c.patient_id = p_patient_id
        AND c.status = 'approved'
    )
$function$;

-- Fix get_patient_email_for_relative to require approved status
CREATE OR REPLACE FUNCTION public.get_patient_email_for_relative(p_patient_id uuid, p_relative_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.email
  FROM auth.users u
  WHERE u.id = p_patient_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_relative_connections c
      WHERE c.patient_id = p_patient_id
        AND c.relative_id = p_relative_id
        AND c.status = 'approved'
    )
$function$;

-- Fix get_relative_email_for_patient to require approved status
CREATE OR REPLACE FUNCTION public.get_relative_email_for_patient(p_relative_id uuid, p_patient_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.email
  FROM auth.users u
  WHERE u.id = p_relative_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_relative_connections c
      WHERE c.relative_id = p_relative_id
        AND c.patient_id = p_patient_id
        AND c.status = 'approved'
    )
$function$;

-- Fix get_relative_profile_for_patient to require approved status
CREATE OR REPLACE FUNCTION public.get_relative_profile_for_patient(p_relative_id uuid, p_patient_id uuid)
 RETURNS TABLE(first_name text, last_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.first_name, p.last_name
  FROM public.profiles p
  WHERE p.user_id = p_relative_id
    AND EXISTS (
      SELECT 1
      FROM public.patient_relative_connections c
      WHERE c.relative_id = p_relative_id
        AND c.patient_id = p_patient_id
        AND c.status = 'approved'
    )
$function$;

-- Fix link_delegate_on_signup to NOT auto-approve - keep status as pending for doctor approval
CREATE OR REPLACE FUNCTION public.link_delegate_on_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Link the delegate but keep status as 'pending' - doctor must approve manually
  UPDATE public.doctor_delegates
  SET delegate_id = NEW.id, updated_at = now()
  WHERE delegate_email = NEW.email AND delegate_id IS NULL;
  RETURN NEW;
END;
$function$;