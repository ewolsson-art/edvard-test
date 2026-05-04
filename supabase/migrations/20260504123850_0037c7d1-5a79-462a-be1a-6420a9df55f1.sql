
-- 1. CHAT MESSAGES: restrict UPDATE to read-receipts by recipient
DROP POLICY IF EXISTS "Users can update messages in their connections" ON public.chat_messages;

CREATE POLICY "Recipients can mark messages as read"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
      AND (pdc.patient_id = auth.uid() OR pdc.doctor_id = auth.uid())
      AND pdc.status = 'approved'
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND read_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
      AND (pdc.patient_id = auth.uid() OR pdc.doctor_id = auth.uid())
      AND pdc.status = 'approved'
  )
);

-- 2. COMMUNITY: restrict direct table SELECT to owner only; expose safe payload via SECURITY DEFINER functions that mask user_id for anonymous rows.
DROP POLICY IF EXISTS "Authenticated users can read posts" ON public.community_posts;
CREATE POLICY "Users can read own posts directly"
ON public.community_posts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can read replies" ON public.community_replies;
CREATE POLICY "Users can read own replies directly"
ON public.community_replies
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_community_posts_safe()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  content text,
  category text,
  is_anonymous boolean,
  anonymous_name text,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    CASE WHEN p.is_anonymous AND p.user_id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
         THEN NULL ELSE p.user_id END,
    p.title, p.content, p.category, p.is_anonymous, p.anonymous_name,
    p.image_url, p.created_at, p.updated_at
  FROM public.community_posts p
  WHERE auth.uid() IS NOT NULL
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_community_replies_safe()
RETURNS TABLE (
  id uuid,
  post_id uuid,
  user_id uuid,
  content text,
  is_anonymous boolean,
  anonymous_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, r.post_id,
    CASE WHEN r.is_anonymous AND r.user_id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
         THEN NULL ELSE r.user_id END,
    r.content, r.is_anonymous, r.anonymous_name, r.created_at, r.updated_at
  FROM public.community_replies r
  WHERE auth.uid() IS NOT NULL
  ORDER BY r.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_community_posts_safe() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_posts_safe() TO authenticated;
REVOKE ALL ON FUNCTION public.get_community_replies_safe() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_replies_safe() TO authenticated;

-- 3. REALTIME: restrict channel subscriptions to known public-table topics or user-namespaced topics.
DROP POLICY IF EXISTS "Authenticated users can read public realtime topics" ON realtime.messages;

CREATE POLICY "Authenticated users can read public realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IN (
    'mood_entries',
    'patient_doctor_connections',
    'chat_messages',
    'patient_relative_connections',
    'notifications'
  )
  OR realtime.topic() LIKE auth.uid()::text || ':%'
);
