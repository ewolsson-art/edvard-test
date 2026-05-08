-- Revoke from PUBLIC (default grant) and re-grant only to authenticated.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.get_doctor_email_for_patient(uuid, uuid)',
    'public.get_patient_email_for_doctor(uuid, uuid)',
    'public.get_relative_id_by_email(text)',
    'public.get_relative_profile_for_patient(uuid, uuid)',
    'public.get_patient_email_for_relative(uuid, uuid)',
    'public.get_relative_email_for_patient(uuid, uuid)',
    'public.get_doctor_profile_for_patient(uuid, uuid)',
    'public.has_role(uuid, public.app_role)',
    'public.get_user_role(uuid)',
    'public.get_patient_id_by_email(text)',
    'public.get_doctor_id_by_email(text)',
    'public.assign_initial_role(public.app_role)',
    'public.get_community_replies_safe()',
    'public.get_community_posts_safe()',
    'public.get_post_reaction_counts()',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.enqueue_email(text, jsonb)',
    'public.read_email_batch(text, integer, integer)',
    'public.delete_email(text, bigint)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;