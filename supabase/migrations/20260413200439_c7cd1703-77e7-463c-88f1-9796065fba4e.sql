
-- Drop the broken policy
DROP POLICY IF EXISTS "Patients can update relative connection settings" ON public.patient_relative_connections;

-- Recreate with a proper immutability check using a trigger instead
CREATE POLICY "Patients can update relative connection settings"
ON public.patient_relative_connections
FOR UPDATE TO authenticated
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

-- Use a trigger to prevent patients from changing immutable fields
CREATE OR REPLACE FUNCTION public.prevent_relative_connection_immutable_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing ownership fields
  IF NEW.patient_id != OLD.patient_id THEN
    RAISE EXCEPTION 'Cannot change patient_id';
  END IF;
  IF NEW.relative_id != OLD.relative_id THEN
    RAISE EXCEPTION 'Cannot change relative_id';
  END IF;
  IF NEW.initiated_by != OLD.initiated_by THEN
    RAISE EXCEPTION 'Cannot change initiated_by';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_relative_connection_immutable_changes ON public.patient_relative_connections;
CREATE TRIGGER prevent_relative_connection_immutable_changes
  BEFORE UPDATE ON public.patient_relative_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_relative_connection_immutable_changes();
