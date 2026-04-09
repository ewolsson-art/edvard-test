
-- Update profiles RLS for relatives to include pending connections
DROP POLICY IF EXISTS "Relatives can view connected patient profiles" ON public.profiles;
CREATE POLICY "Relatives can view connected patient profiles"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM patient_relative_connections
    WHERE patient_relative_connections.patient_id = profiles.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status IN ('approved', 'pending')
  )
);

-- Update the email RPC to also work for pending connections
CREATE OR REPLACE FUNCTION public.get_patient_email_for_relative(p_patient_id uuid, p_relative_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users
  WHERE id = p_patient_id
  AND EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_id = p_patient_id
      AND relative_id = p_relative_id
      AND status IN ('approved', 'pending')
  );
$$;
