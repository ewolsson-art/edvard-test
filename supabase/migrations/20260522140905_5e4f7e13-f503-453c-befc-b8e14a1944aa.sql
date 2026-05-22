ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

CREATE INDEX IF NOT EXISTS idx_page_views_user_created ON public.page_views (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_referrer ON public.page_views (referrer) WHERE referrer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON public.page_views (utm_source) WHERE utm_source IS NOT NULL;