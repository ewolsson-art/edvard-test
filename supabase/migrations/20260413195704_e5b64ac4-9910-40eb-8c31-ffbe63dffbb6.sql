
-- Fix: recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.community_posts_safe;
DROP VIEW IF EXISTS public.community_replies_safe;

CREATE VIEW public.community_posts_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END AS user_id,
  title,
  content,
  category,
  is_anonymous,
  anonymous_name,
  image_url,
  created_at,
  updated_at,
  CASE WHEN user_id = auth.uid() THEN user_id ELSE NULL END AS real_user_id
FROM public.community_posts;

CREATE VIEW public.community_replies_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END AS user_id,
  post_id,
  content,
  is_anonymous,
  anonymous_name,
  created_at,
  updated_at,
  CASE WHEN user_id = auth.uid() THEN user_id ELSE NULL END AS real_user_id
FROM public.community_replies;
