
-- Add notify_low_mood column to patient_relative_connections
ALTER TABLE public.patient_relative_connections
ADD COLUMN notify_low_mood boolean NOT NULL DEFAULT false;

-- Create trigger function to notify relatives on low mood check-in
CREATE OR REPLACE FUNCTION public.notify_relative_on_low_mood()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_connection RECORD;
  v_patient_name TEXT;
BEGIN
  -- Only trigger for 'depressed' mood
  IF NEW.mood != 'depressed' THEN
    RETURN NEW;
  END IF;

  -- Get patient name
  SELECT COALESCE(first_name, 'Din närstående') INTO v_patient_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Find all approved relative connections with notify_low_mood enabled
  FOR v_connection IN
    SELECT relative_id
    FROM public.patient_relative_connections
    WHERE patient_id = NEW.user_id
      AND status = 'approved'
      AND notify_low_mood = true
      AND share_mood = true
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
    VALUES (
      v_connection.relative_id,
      'low_mood_alert',
      'Lågt mående uppmätt',
      v_patient_name || ' har checkat in som "Mycket låg" idag',
      NEW.id,
      'mood_entry',
      v_patient_name
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on mood_entries
CREATE TRIGGER trigger_notify_relative_low_mood
AFTER INSERT OR UPDATE OF mood ON public.mood_entries
FOR EACH ROW
EXECUTE FUNCTION public.notify_relative_on_low_mood();
