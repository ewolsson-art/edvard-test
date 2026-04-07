
-- Community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  anonymous_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to community_posts" ON public.community_posts FOR SELECT TO anon USING (false);
CREATE POLICY "Authenticated users can read all posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Community reactions table
CREATE TABLE public.community_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to community_reactions" ON public.community_reactions FOR SELECT TO anon USING (false);
CREATE POLICY "Authenticated users can read all reactions" ON public.community_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own reactions" ON public.community_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.community_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
