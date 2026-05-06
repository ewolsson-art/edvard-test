
-- 1. Restrict relative -> patient profile visibility to approved connections only
DROP POLICY IF EXISTS "Relatives can view connected patient profiles" ON public.profiles;
CREATE POLICY "Relatives can view connected patient profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patient_relative_connections
    WHERE patient_relative_connections.patient_id = profiles.user_id
      AND patient_relative_connections.relative_id = auth.uid()
      AND patient_relative_connections.status = 'approved'
  )
);

-- 2. Restrict realtime topic access to user-scoped topics only
DROP POLICY IF EXISTS "Authenticated users can read public realtime topics" ON realtime.messages;
CREATE POLICY "Users can read their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE (auth.uid()::text || ':%')
);

-- 3. Restrict community_reactions reads + provide aggregated counts via security definer
DROP POLICY IF EXISTS "Authenticated users can read reactions" ON public.community_reactions;
CREATE POLICY "Users can read their own reactions"
ON public.community_reactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_post_reaction_counts()
RETURNS TABLE(post_id uuid, reaction_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT post_id, COUNT(*)::bigint AS reaction_count
  FROM public.community_reactions
  GROUP BY post_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_reaction_counts() TO authenticated;
