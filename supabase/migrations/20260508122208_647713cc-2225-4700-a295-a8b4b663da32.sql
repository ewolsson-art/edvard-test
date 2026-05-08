DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.prevent_relative_connection_immutable_changes()',
    'public.notify_on_reply()',
    'public.notify_on_reaction()',
    'public.notify_relative_on_low_mood()',
    'public.notify_on_relative_connection()',
    'public.notify_on_doctor_connection()',
    'public.link_delegate_on_signup()',
    'public.update_updated_at_column()',
    'public.handle_new_user_role()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;