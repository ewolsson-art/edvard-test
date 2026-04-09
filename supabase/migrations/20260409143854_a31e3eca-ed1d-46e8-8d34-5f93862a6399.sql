
CREATE OR REPLACE FUNCTION public.notify_on_relative_connection()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.initiated_by = 'relative' THEN
      SELECT COALESCE(first_name || ' ' || last_name, 'En anhörig') INTO v_name
      FROM public.profiles WHERE user_id = NEW.relative_id;
      
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request', v_name || ' vill följa ditt mående', v_name || ' vill få åtkomst till din data', NEW.id, 'relative_connection', v_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      IF NEW.initiated_by = 'relative' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.relative_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', NEW.id, 'relative_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av anhörig', NEW.id, 'relative_connection');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_doctor_connection()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.initiated_by = 'doctor' THEN
      SELECT COALESCE(first_name || ' ' || last_name, 'En vårdgivare') INTO v_doctor_name
      FROM public.profiles WHERE user_id = NEW.doctor_id;
      
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request', v_doctor_name || ' vill följa ditt mående', v_doctor_name || ' vill få åtkomst till din data', NEW.id, 'doctor_connection', v_doctor_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      IF NEW.initiated_by = 'doctor' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.doctor_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', NEW.id, 'doctor_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av vårdgivaren', NEW.id, 'doctor_connection');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
