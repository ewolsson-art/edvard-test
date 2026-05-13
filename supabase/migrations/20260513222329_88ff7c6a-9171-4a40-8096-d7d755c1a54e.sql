
-- 1. Flytta service_role-policies från "public" → "service_role"
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
      AND (qual ILIKE '%service_role%' OR with_check ILIKE '%service_role%')
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO service_role',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2. Flytta vanliga användarpolicies från "public" → "authenticated"
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3. Lås interna kö-/jobbfunktioner till service_role
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 4. Återkalla EXECUTE på alla user-facing SECURITY DEFINER-funktioner från anon
REVOKE EXECUTE ON FUNCTION public.get_doctor_email_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_email_for_doctor(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_email_for_relative(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_email_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_profile_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_profile_for_patient(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_relative_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_patient_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_doctor_id_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_initial_role(app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_community_posts_safe() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_community_replies_safe() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_post_reaction_counts() FROM anon;
