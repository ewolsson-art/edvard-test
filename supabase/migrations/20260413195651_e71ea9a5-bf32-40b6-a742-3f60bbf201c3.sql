
-- ===========================================
-- 1. ANONYMOUS POSTS: Create safe views
-- ===========================================

-- Safe view for community_posts that masks user_id for anonymous posts
CREATE OR REPLACE VIEW public.community_posts_safe AS
SELECT
  id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END AS user_id,
  title,
  content,
  category,
  is_anonymous,
  anonymous_name,
  image_url,
  created_at,
  updated_at,
  -- Keep real user_id only visible to the post owner
  CASE WHEN user_id = auth.uid() THEN user_id ELSE NULL END AS real_user_id
FROM public.community_posts;

-- Safe view for community_replies
CREATE OR REPLACE VIEW public.community_replies_safe AS
SELECT
  id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END AS user_id,
  post_id,
  content,
  is_anonymous,
  anonymous_name,
  created_at,
  updated_at,
  CASE WHEN user_id = auth.uid() THEN user_id ELSE NULL END AS real_user_id
FROM public.community_replies;

-- ===========================================
-- 2. POLL VOTES: Restrict to own votes only
-- ===========================================

DROP POLICY IF EXISTS "Authenticated users can view poll votes" ON public.poll_votes;
CREATE POLICY "Users can only view their own votes"
ON public.poll_votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ===========================================
-- 3. DOCTOR CONNECTION: Restrict doctor UPDATE columns
-- ===========================================

-- Drop the old unrestricted doctor update policy
DROP POLICY IF EXISTS "Doctors can update connection status" ON public.patient_doctor_connections;

-- New policy: doctors can only update status (approve/reject), not sharing flags
CREATE POLICY "Doctors can update connection status only"
ON public.patient_doctor_connections
FOR UPDATE
TO public
USING (auth.uid() = doctor_id)
WITH CHECK (
  auth.uid() = doctor_id
  AND share_mood = (SELECT share_mood FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND share_sleep = (SELECT share_sleep FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND share_eating = (SELECT share_eating FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND share_exercise = (SELECT share_exercise FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND share_medication = (SELECT share_medication FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND share_comments = (SELECT share_comments FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND share_ai_insights = (SELECT share_ai_insights FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
  AND chat_enabled = (SELECT chat_enabled FROM public.patient_doctor_connections WHERE id = patient_doctor_connections.id)
);

-- ===========================================
-- 4. NOTIFICATIONS: Remove user INSERT policy
-- ===========================================

DROP POLICY IF EXISTS "Users can only insert self-notifications" ON public.notifications;

-- ===========================================
-- 5. PATIENT-RELATIVE: Restrict patient UPDATE to sharing flags and status only
-- ===========================================

DROP POLICY IF EXISTS "Patients can update their relative connections" ON public.patient_relative_connections;

-- Patients can update but cannot change relative_id or patient_id
CREATE POLICY "Patients can update relative connection settings"
ON public.patient_relative_connections
FOR UPDATE
TO public
USING (auth.uid() = patient_id)
WITH CHECK (
  auth.uid() = patient_id
  AND patient_id = (SELECT patient_id FROM public.patient_relative_connections WHERE id = patient_relative_connections.id)
  AND relative_id = (SELECT relative_id FROM public.patient_relative_connections WHERE id = patient_relative_connections.id)
  AND initiated_by = (SELECT initiated_by FROM public.patient_relative_connections WHERE id = patient_relative_connections.id)
);
