-- Tabell för att logga sidvisningar (endast path, ingen query/personlig data)
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Användare kan logga sina egna sidvisningar
CREATE POLICY "Users can insert their own page views"
ON public.page_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Användare kan se sina egna sidvisningar
CREATE POLICY "Users can view their own page views"
ON public.page_views FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins kan se alla sidvisningar
CREATE POLICY "Admins can view all page views"
ON public.page_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blockera anon
CREATE POLICY "Deny anon access to page_views"
ON public.page_views FOR SELECT TO anon USING (false);