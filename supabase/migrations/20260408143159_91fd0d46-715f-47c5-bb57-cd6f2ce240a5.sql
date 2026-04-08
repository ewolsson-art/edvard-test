CREATE TABLE public.poll_options (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view poll options"
ON public.poll_options FOR SELECT USING (true);

CREATE POLICY "Users can create poll options for own posts"
ON public.poll_options FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.community_posts WHERE id = post_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete poll options for own posts"
ON public.poll_options FOR DELETE
USING (EXISTS (SELECT 1 FROM public.community_posts WHERE id = post_id AND user_id = auth.uid()));

CREATE TABLE public.poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(option_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view poll votes"
ON public.poll_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.poll_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their vote"
ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);