
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  reference_id TEXT,
  reference_type TEXT,
  actor_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System inserts (via triggers) - allow insert for authenticated users
CREATE POLICY "Users can receive notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Deny public/anon access
CREATE POLICY "Deny public access to notifications"
ON public.notifications FOR SELECT
TO anon
USING (false);

-- Index for fast lookup
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications (user_id) WHERE read = false;

-- Trigger: notify post author on new reply
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_user_id UUID;
  v_post_title TEXT;
  v_author_name TEXT;
BEGIN
  SELECT user_id, COALESCE(title, LEFT(content, 50)) INTO v_post_user_id, v_post_title
  FROM public.community_posts WHERE id = NEW.post_id;

  -- Don't notify yourself
  IF v_post_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  v_author_name := COALESCE(NEW.anonymous_name, 'Någon');

  INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
  VALUES (v_post_user_id, 'forum_reply', 'Nytt svar på ditt inlägg', v_post_title, NEW.post_id, 'community_post', v_author_name);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_community_reply_notify
AFTER INSERT ON public.community_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reply();

-- Trigger: notify post author on new reaction
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_user_id UUID;
  v_post_title TEXT;
BEGIN
  SELECT user_id, COALESCE(title, LEFT(content, 50)) INTO v_post_user_id, v_post_title
  FROM public.community_posts WHERE id = NEW.post_id;

  IF v_post_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
  VALUES (v_post_user_id, 'forum_like', 'Någon gillade ditt inlägg', v_post_title, NEW.post_id, 'community_post');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_community_reaction_notify
AFTER INSERT ON public.community_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_reaction();

-- Trigger: notify patient on new connection request (doctor)
CREATE OR REPLACE FUNCTION public.notify_on_doctor_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_name TEXT;
  v_notify_user UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.initiated_by = 'doctor' THEN
      SELECT COALESCE(first_name || ' ' || last_name, 'En vårdgivare') INTO v_doctor_name
      FROM public.profiles WHERE user_id = NEW.doctor_id;
      
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request', 'Ny kopplingsförfrågan', 'En vårdgivare vill få åtkomst till din data', NEW.id, 'doctor_connection', v_doctor_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      -- Notify the initiator that their request was approved
      IF NEW.initiated_by = 'doctor' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.doctor_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', NEW.id, 'doctor_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av vårdgivaren', NEW.id, 'doctor_connection');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_doctor_connection_notify
AFTER INSERT OR UPDATE ON public.patient_doctor_connections
FOR EACH ROW EXECUTE FUNCTION public.notify_on_doctor_connection();

-- Trigger: notify patient on new connection request (relative)
CREATE OR REPLACE FUNCTION public.notify_on_relative_connection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.initiated_by = 'relative' THEN
      SELECT COALESCE(first_name || ' ' || last_name, 'En anhörig') INTO v_name
      FROM public.profiles WHERE user_id = NEW.relative_id;
      
      INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, actor_name)
      VALUES (NEW.patient_id, 'connection_request', 'Ny kopplingsförfrågan', 'En anhörig vill få åtkomst till din data', NEW.id, 'relative_connection', v_name);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
      IF NEW.initiated_by = 'relative' THEN
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.relative_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts', NEW.id, 'relative_connection');
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES (NEW.patient_id, 'connection_approved', 'Koppling godkänd', 'Din förfrågan har godkänts av anhörig', NEW.id, 'relative_connection');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_relative_connection_notify
AFTER INSERT OR UPDATE ON public.patient_relative_connections
FOR EACH ROW EXECUTE FUNCTION public.notify_on_relative_connection();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
