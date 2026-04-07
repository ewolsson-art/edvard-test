
-- Allow anon to read posts
DROP POLICY "Deny anon access to community_posts" ON public.community_posts;
CREATE POLICY "Anyone can read posts" ON public.community_posts FOR SELECT USING (true);

-- Allow anon to read reactions  
DROP POLICY "Deny anon access to community_reactions" ON public.community_reactions;
CREATE POLICY "Anyone can read reactions" ON public.community_reactions FOR SELECT USING (true);

-- Allow anon to read profiles (for author names) - already has policies for authenticated
-- We need non-anonymous posts to show names, so let's allow reading first_name only via the existing select
