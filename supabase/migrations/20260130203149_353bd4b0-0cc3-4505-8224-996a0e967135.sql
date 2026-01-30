-- Create table for shared reports
CREATE TABLE public.shared_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_key TEXT NOT NULL UNIQUE,
  report_type TEXT NOT NULL CHECK (report_type IN ('month', 'year')),
  period TEXT NOT NULL,
  stats JSONB NOT NULL,
  medications JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for fast lookup by share_key
CREATE INDEX idx_shared_reports_share_key ON public.shared_reports(share_key);

-- Enable RLS
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own shared reports
CREATE POLICY "Users can create their own shared reports" 
ON public.shared_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own shared reports
CREATE POLICY "Users can view their own shared reports" 
ON public.shared_reports 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can delete their own shared reports
CREATE POLICY "Users can delete their own shared reports" 
ON public.shared_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Anyone can view shared reports by share_key (for public sharing)
CREATE POLICY "Anyone can view reports by share_key" 
ON public.shared_reports 
FOR SELECT 
USING (true);