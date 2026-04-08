
-- =====================================================
-- 1. FIX PRIVILEGE ESCALATION: Harden role trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always assign 'patient' role. Role upgrades require admin action.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient'::app_role)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Remove self-insert policy on user_roles
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- =====================================================
-- 2. FIX NOTIFICATIONS: Replace unrestricted INSERT
-- =====================================================
DROP POLICY IF EXISTS "Allow trigger inserts on notifications" ON public.notifications;

-- Only allow self-notifications from authenticated users
-- Trigger functions use SECURITY DEFINER and bypass RLS
CREATE POLICY "Users can only insert self-notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. FIX ANONYMOUS POSTS/REPLIES: Remove anon SELECT
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can read replies" ON public.community_replies;
DROP POLICY IF EXISTS "Anyone can read reactions" ON public.community_reactions;
DROP POLICY IF EXISTS "Anyone can view poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Anyone can view poll votes" ON public.poll_votes;

-- Recreate for authenticated only
CREATE POLICY "Authenticated users can read posts"
  ON public.community_posts FOR SELECT TO authenticated
  USING (true);

-- Remove duplicate if exists
DROP POLICY IF EXISTS "Authenticated users can read all posts" ON public.community_posts;

CREATE POLICY "Authenticated users can read replies"
  ON public.community_replies FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can read all reactions" ON public.community_reactions;
CREATE POLICY "Authenticated users can read reactions"
  ON public.community_reactions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view poll options"
  ON public.poll_options FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view poll votes"
  ON public.poll_votes FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- 4. FIX SHARE FLAGS: Doctor policies
-- =====================================================

-- mood_entries: doctor must have share_mood=true
DROP POLICY IF EXISTS "Doctors can view connected patient mood entries" ON public.mood_entries;
CREATE POLICY "Doctors can view connected patient mood entries"
  ON public.mood_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_doctor_connections.patient_id = mood_entries.user_id
      AND patient_doctor_connections.doctor_id = auth.uid()
      AND patient_doctor_connections.status = 'approved'
      AND patient_doctor_connections.share_mood = true
  ));

-- medications: doctor must have share_medication=true
DROP POLICY IF EXISTS "Doctors can view connected patient medications" ON public.medications;
CREATE POLICY "Doctors can view connected patient medications"
  ON public.medications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_doctor_connections.patient_id = medications.user_id
      AND patient_doctor_connections.doctor_id = auth.uid()
      AND patient_doctor_connections.status = 'approved'
      AND patient_doctor_connections.share_medication = true
  ));

-- medication_logs: doctor must have share_medication=true
DROP POLICY IF EXISTS "Doctors can view connected patient medication logs" ON public.medication_logs;
CREATE POLICY "Doctors can view connected patient medication logs"
  ON public.medication_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_doctor_connections.patient_id = medication_logs.user_id
      AND patient_doctor_connections.doctor_id = auth.uid()
      AND patient_doctor_connections.status = 'approved'
      AND patient_doctor_connections.share_medication = true
  ));

-- characteristics: doctor must have approved connection (share_mood as proxy)
DROP POLICY IF EXISTS "Doctors can view connected patient characteristics" ON public.characteristics;
CREATE POLICY "Doctors can view connected patient characteristics"
  ON public.characteristics FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_doctor_connections.patient_id = characteristics.user_id
      AND patient_doctor_connections.doctor_id = auth.uid()
      AND patient_doctor_connections.status = 'approved'
      AND patient_doctor_connections.share_mood = true
  ));

-- diagnoses: doctor must have approved connection
DROP POLICY IF EXISTS "Doctors can view connected patient diagnoses" ON public.diagnoses;
CREATE POLICY "Doctors can view connected patient diagnoses"
  ON public.diagnoses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_doctor_connections
    WHERE patient_doctor_connections.patient_id = diagnoses.user_id
      AND patient_doctor_connections.doctor_id = auth.uid()
      AND patient_doctor_connections.status = 'approved'
  ));

-- =====================================================
-- 5. FIX SHARE FLAGS: Relative policies
-- =====================================================

-- mood_entries: relative must have share_mood=true
DROP POLICY IF EXISTS "Relatives can view connected patient mood entries" ON public.mood_entries;
CREATE POLICY "Relatives can view connected patient mood entries"
  ON public.mood_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_relative_connections.patient_id = mood_entries.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
      AND patient_relative_connections.share_mood = true
  ));

-- medications: relative must have share_medication=true
DROP POLICY IF EXISTS "Relatives can view connected patient medications" ON public.medications;
CREATE POLICY "Relatives can view connected patient medications"
  ON public.medications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_relative_connections.patient_id = medications.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
      AND patient_relative_connections.share_medication = true
  ));

-- medication_logs: relative must have share_medication=true
DROP POLICY IF EXISTS "Relatives can view connected patient medication logs" ON public.medication_logs;
CREATE POLICY "Relatives can view connected patient medication logs"
  ON public.medication_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_relative_connections.patient_id = medication_logs.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
      AND patient_relative_connections.share_medication = true
  ));

-- characteristics: relative must have share_characteristics=true
DROP POLICY IF EXISTS "Relatives can view connected patient characteristics" ON public.characteristics;
CREATE POLICY "Relatives can view connected patient characteristics"
  ON public.characteristics FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_relative_connections.patient_id = characteristics.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
      AND patient_relative_connections.share_characteristics = true
  ));

-- diagnoses: relative must have approved connection
DROP POLICY IF EXISTS "Relatives can view connected patient diagnoses" ON public.diagnoses;
CREATE POLICY "Relatives can view connected patient diagnoses"
  ON public.diagnoses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patient_relative_connections
    WHERE patient_relative_connections.patient_id = diagnoses.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  ));

-- =====================================================
-- 6. FIX: Patients can read relative comments about them
-- =====================================================
CREATE POLICY "Patients can view comments about them"
  ON public.relative_comments FOR SELECT TO authenticated
  USING (auth.uid() = patient_id);

-- =====================================================
-- 7. FIX: Custom checkin deny policies - narrow to anon only
-- =====================================================
DROP POLICY IF EXISTS "Deny public access to custom_checkin_questions" ON public.custom_checkin_questions;
CREATE POLICY "Deny anon access to custom_checkin_questions"
  ON public.custom_checkin_questions FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS "Deny public access to custom_checkin_answers" ON public.custom_checkin_answers;
CREATE POLICY "Deny anon access to custom_checkin_answers"
  ON public.custom_checkin_answers FOR SELECT TO anon
  USING (false);
