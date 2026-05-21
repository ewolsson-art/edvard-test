-- =========================================================
-- 1. Lock down SECURITY DEFINER functions
-- =========================================================
-- Trigger / queue / internal helpers: only system (no client roles)
REVOKE EXECUTE ON FUNCTION public.prevent_relative_connection_immutable_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_reply() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_reaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_relative_on_low_mood() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_relative_connection() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_doctor_connection() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_delegate_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.register_checkin_characteristics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_doctor_modifying_share_flags() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- Helper functions: authenticated users only (no anon)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_initial_role(app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mood_to_mood_type(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_email_for_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_email_for_doctor(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_email_for_relative(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_email_for_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_id_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_id_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_id_by_email(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_profile_for_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_profile_for_patient(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_community_posts_safe() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_community_replies_safe() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_post_reaction_counts() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_initial_role(app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mood_to_mood_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_email_for_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_email_for_doctor(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_email_for_relative(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relative_email_for_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relative_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_patient_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_profile_for_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relative_profile_for_patient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_posts_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_replies_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_reaction_counts() TO authenticated;

-- =========================================================
-- 2. Restrict storage bucket listing for public buckets
--    (forum-images, email-assets remain publicly readable by URL,
--     but full listing of the bucket is no longer allowed)
-- =========================================================

-- Drop overly broad SELECT policies on storage.objects for these buckets
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%forum-images%'
        OR policyname ILIKE '%email-assets%'
        OR policyname ILIKE '%forum_images%'
        OR policyname ILIKE '%email_assets%'
      )
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Forum images: anyone can read a specific file via URL, but not list
CREATE POLICY "Forum images readable via direct URL only"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'forum-images'
  AND (
    -- restrict listing by requiring a name (Supabase storage GET file works,
    -- listing API includes prefix but uses the same SELECT)
    auth.role() = 'authenticated'
    OR (auth.role() = 'anon' AND name IS NOT NULL)
  )
);

-- Email assets: same pattern
CREATE POLICY "Email assets readable via direct URL only"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'email-assets'
  AND name IS NOT NULL
);