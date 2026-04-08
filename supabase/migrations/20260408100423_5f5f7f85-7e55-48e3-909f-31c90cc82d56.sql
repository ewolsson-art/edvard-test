
-- Drop and recreate triggers to ensure they're properly attached
DROP TRIGGER IF EXISTS on_community_reply_notify ON public.community_replies;
DROP TRIGGER IF EXISTS on_community_reaction_notify ON public.community_reactions;
DROP TRIGGER IF EXISTS on_doctor_connection_notify ON public.patient_doctor_connections;
DROP TRIGGER IF EXISTS on_relative_connection_notify ON public.patient_relative_connections;

CREATE TRIGGER on_community_reply_notify
  AFTER INSERT ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reply();

CREATE TRIGGER on_community_reaction_notify
  AFTER INSERT ON public.community_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction();

CREATE TRIGGER on_doctor_connection_notify
  AFTER INSERT OR UPDATE ON public.patient_doctor_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_doctor_connection();

CREATE TRIGGER on_relative_connection_notify
  AFTER INSERT OR UPDATE ON public.patient_relative_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_relative_connection();

-- Fix INSERT RLS: triggers run as SECURITY DEFINER and insert for OTHER users
DROP POLICY IF EXISTS "Triggers can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow trigger inserts on notifications" ON public.notifications;

CREATE POLICY "Allow trigger inserts on notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
