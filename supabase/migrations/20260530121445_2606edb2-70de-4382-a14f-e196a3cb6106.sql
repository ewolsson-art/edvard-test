-- C-1: Restrict doctor email lookup to parties in the connection
CREATE OR REPLACE FUNCTION public.get_doctor_email_for_patient(p_doctor_id uuid, p_patient_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() <> p_patient_id AND auth.uid() <> p_doctor_id) THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_id = p_patient_id
      AND doctor_id = p_doctor_id
      AND status = 'approved'
  ) THEN
    SELECT email INTO v_email FROM auth.users WHERE id = p_doctor_id;
    RETURN v_email;
  END IF;
  RETURN NULL;
END;
$function$;

-- M-1: Add WITH CHECK on UPDATE policies to prevent ownership reassignment
DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts"
ON public.community_posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- M-2: Require authenticated user on feedback insert (no anonymous user_id NULL)
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- H-3: Make forum-images bucket private (authenticated SELECT policy already exists)
UPDATE storage.buckets SET public = false WHERE id = 'forum-images';