
CREATE OR REPLACE FUNCTION public.mood_to_mood_type(_mood text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _mood IN ('severe_elevated','elevated','somewhat_elevated') THEN 'elevated'
    WHEN _mood IN ('somewhat_depressed','depressed','severe_depressed') THEN 'depressed'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.register_checkin_characteristics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mood_type text;
  v_tag text;
  v_name text;
BEGIN
  v_mood_type := public.mood_to_mood_type(NEW.mood);
  IF v_mood_type IS NULL OR NEW.tags IS NULL THEN
    RETURN NEW;
  END IF;

  FOREACH v_tag IN ARRAY NEW.tags LOOP
    v_name := trim(v_tag);
    IF v_name = '' THEN CONTINUE; END IF;
    INSERT INTO public.characteristics (user_id, name, mood_type, source)
    VALUES (NEW.user_id, v_name, v_mood_type, 'checkin');
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_register_checkin_characteristics ON public.mood_entries;
CREATE TRIGGER trg_register_checkin_characteristics
AFTER INSERT OR UPDATE OF tags, mood ON public.mood_entries
FOR EACH ROW
EXECUTE FUNCTION public.register_checkin_characteristics();

INSERT INTO public.characteristics (user_id, name, mood_type, source, created_at)
SELECT
  me.user_id,
  trim(t) AS name,
  public.mood_to_mood_type(me.mood) AS mood_type,
  'checkin' AS source,
  me.created_at
FROM public.mood_entries me
CROSS JOIN LATERAL unnest(me.tags) AS t
WHERE me.tags IS NOT NULL
  AND public.mood_to_mood_type(me.mood) IS NOT NULL
  AND trim(t) <> '';
