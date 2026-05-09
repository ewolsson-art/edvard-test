
UPDATE public.user_roles SET role = 'admin'::app_role
WHERE user_id = 'ccf2f02c-efc6-46ab-9acc-0a0eed1caf24'::uuid;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

UPDATE public.community_posts SET status = 'approved' WHERE status = 'pending';

DROP POLICY IF EXISTS "Admins can view all posts" ON public.community_posts;
CREATE POLICY "Admins can view all posts" ON public.community_posts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update any post" ON public.community_posts;
CREATE POLICY "Admins can update any post" ON public.community_posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any post" ON public.community_posts;
CREATE POLICY "Admins can delete any post" ON public.community_posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete any reply" ON public.community_replies;
CREATE POLICY "Admins can delete any reply" ON public.community_replies
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.get_community_posts_safe();
CREATE FUNCTION public.get_community_posts_safe()
 RETURNS TABLE(id uuid, user_id uuid, title text, content text, category text, is_anonymous boolean, anonymous_name text, image_url text, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id,
    CASE WHEN p.is_anonymous AND p.user_id <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
         THEN NULL ELSE p.user_id END,
    p.title, p.content, p.category, p.is_anonymous, p.anonymous_name,
    p.image_url, p.status, p.created_at, p.updated_at
  FROM public.community_posts p
  WHERE auth.uid() IS NOT NULL
    AND (
      p.status = 'approved'
      OR p.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  ORDER BY p.created_at DESC;
$function$;
