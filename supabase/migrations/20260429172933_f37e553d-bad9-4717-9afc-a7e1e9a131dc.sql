CREATE OR REPLACE FUNCTION public.notify_on_doctor_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_name TEXT;
  v_patient_name TEXT;
  v_connection_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.notifications
    WHERE reference_id = OLD.id::text
      AND reference_type = 'doctor_connection'
      AND type = 'connection_request';
    RETURN OLD;
  END IF;

  v_connection_id := NEW.id::text;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' AND NEW.initiated_by = 'doctor' THEN
      SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), 'En vårdgivare')
        INTO v_doctor_name
      FROM public.profiles WHERE user_id = NEW.doctor_id;

      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request',
              v_doctor_name || ' vill följa ditt mående',
              v_doctor_name || ' vill få åtkomst till din data',
              v_connection_id, 'doctor_connection', v_doctor_name);
    ELSIF NEW.status = 'pending' AND NEW.initiated_by = 'patient' THEN
      SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), 'En användare')
        INTO v_patient_name
      FROM public.profiles WHERE user_id = NEW.patient_id;

      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.doctor_id, 'connection_request',
              v_patient_name || ' vill dela sin data med dig',
              v_patient_name || ' har skickat en förfrågan om att dela sin data',
              v_connection_id, 'doctor_connection', v_patient_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status <> 'pending' THEN
      DELETE FROM public.notifications
      WHERE reference_id = v_connection_id
        AND reference_type = 'doctor_connection'
        AND type = 'connection_request';
    END IF;

    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      IF NEW.initiated_by = 'doctor' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.doctor_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', v_connection_id, 'doctor_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av vårdgivaren', v_connection_id, 'doctor_connection');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_relative_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_relative_name TEXT;
  v_patient_name TEXT;
  v_connection_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.notifications
    WHERE reference_id = OLD.id::text
      AND reference_type = 'relative_connection'
      AND type = 'connection_request';
    RETURN OLD;
  END IF;

  v_connection_id := NEW.id::text;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' AND NEW.initiated_by = 'relative' THEN
      SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), 'En anhörig')
        INTO v_relative_name
      FROM public.profiles WHERE user_id = NEW.relative_id;

      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request',
              v_relative_name || ' vill följa ditt mående',
              v_relative_name || ' vill få åtkomst till din data',
              v_connection_id, 'relative_connection', v_relative_name);
    ELSIF NEW.status = 'pending' AND NEW.initiated_by = 'patient' THEN
      SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), 'En användare')
        INTO v_patient_name
      FROM public.profiles WHERE user_id = NEW.patient_id;

      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.relative_id, 'connection_request',
              v_patient_name || ' vill dela sitt mående med dig',
              v_patient_name || ' har skickat en förfrågan om att dela sitt mående',
              v_connection_id, 'relative_connection', v_patient_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status <> 'pending' THEN
      DELETE FROM public.notifications
      WHERE reference_id = v_connection_id
        AND reference_type = 'relative_connection'
        AND type = 'connection_request';
    END IF;

    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      IF NEW.initiated_by = 'relative' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.relative_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', v_connection_id, 'relative_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av anhörig', v_connection_id, 'relative_connection');
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_doctor_connection_notify ON public.patient_doctor_connections;
CREATE TRIGGER on_doctor_connection_notify
AFTER INSERT OR UPDATE OR DELETE ON public.patient_doctor_connections
FOR EACH ROW EXECUTE FUNCTION public.notify_on_doctor_connection();

DROP TRIGGER IF EXISTS on_relative_connection_notify ON public.patient_relative_connections;
CREATE TRIGGER on_relative_connection_notify
AFTER INSERT OR UPDATE OR DELETE ON public.patient_relative_connections
FOR EACH ROW EXECUTE FUNCTION public.notify_on_relative_connection();