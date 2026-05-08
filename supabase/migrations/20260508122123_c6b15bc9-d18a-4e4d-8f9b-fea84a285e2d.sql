-- 1) Fix mutable search_path on remaining functions
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;

-- 2) Revoke EXECUTE on SECURITY DEFINER functions from anonymous role.
-- These functions all rely on auth.uid() and should never be callable without login.
REVOKE EXECUTE ON FUNCTION public.get_doctor_email_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_email_for_doctor(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_profile_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_email_for_relative(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_email_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_profile_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_initial_role(public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_community_replies_safe() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_community_posts_safe() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_post_reaction_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon;

-- 3) Tighten storage SELECT policies on avatars and forum-images buckets.
-- Public direct URL access still works (it goes through /object/public/ which bypasses RLS),
-- but anonymous clients can no longer LIST all filenames in the buckets.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Forum images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for forum-images" ON storage.objects;

CREATE POLICY "Authenticated users can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can read forum images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'forum-images');