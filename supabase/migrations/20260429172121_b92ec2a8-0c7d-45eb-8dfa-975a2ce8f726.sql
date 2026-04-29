CREATE OR REPLACE FUNCTION public.notify_on_doctor_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_name TEXT;
  v_patient_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.initiated_by = 'doctor' THEN
      SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), 'En vårdgivare')
        INTO v_doctor_name
      FROM public.profiles WHERE user_id = NEW.doctor_id;

      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request',
              v_doctor_name || ' vill följa ditt mående',
              v_doctor_name || ' vill få åtkomst till din data',
              NEW.id::text, 'doctor_connection', v_doctor_name);
    ELSE
      SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')), ''), 'En användare')
        INTO v_patient_name
      FROM public.profiles WHERE user_id = NEW.patient_id;

      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.doctor_id, 'connection_request',
              v_patient_name || ' vill dela sin data med dig',
              v_patient_name || ' har skickat en förfrågan om att dela sin data',
              NEW.id::text, 'doctor_connection', v_patient_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      IF NEW.initiated_by = 'doctor' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.doctor_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', NEW.id::text, 'doctor_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av vårdgivaren', NEW.id::text, 'doctor_connection');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name, created_at)
SELECT
  c.doctor_id,
  'connection_request',
  COALESCE(NULLIF(TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), ''), 'En användare') || ' vill dela sin data med dig',
  COALESCE(NULLIF(TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), ''), 'En användare') || ' har skickat en förfrågan om att dela sin data',
  c.id::text,
  'doctor_connection',
  COALESCE(NULLIF(TRIM(COALESCE(p.first_name,'') || ' ' || COALESCE(p.last_name,'')), ''), 'En användare'),
  c.created_at
FROM public.patient_doctor_connections c
LEFT JOIN public.profiles p ON p.user_id = c.patient_id
WHERE c.status = 'pending'
  AND c.initiated_by <> 'doctor'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = c.doctor_id
      AND n.reference_id = c.id::text
      AND n.reference_type = 'doctor_connection'
  );