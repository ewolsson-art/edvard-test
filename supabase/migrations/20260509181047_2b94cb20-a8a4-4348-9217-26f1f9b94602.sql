-- Tabell för personliga mönster: en rad per användare, växer över tid
CREATE TABLE public.user_pattern_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Personlig baseline (snitt, fördelning, typisk episodlängd) — räknas om över rullande 60d
  baseline JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Historik av episod-fingeravtryck: array av { kind, startDate, endDate, days, prodromes, followedBy, triggers }
  episode_fingerprints JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Räknad statistik (antal observerade episoder, senaste omräkning, datapunkter)
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_computed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_pattern_profile ENABLE ROW LEVEL SECURITY;

-- Blockera anonym åtkomst explicit
CREATE POLICY "Deny public access to user_pattern_profile"
  ON public.user_pattern_profile
  FOR SELECT
  TO anon
  USING (false);

-- Användaren ser och hanterar sin egen profil
CREATE POLICY "Users can view their own pattern profile"
  ON public.user_pattern_profile
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pattern profile"
  ON public.user_pattern_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pattern profile"
  ON public.user_pattern_profile
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pattern profile"
  ON public.user_pattern_profile
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Vårdgivare med godkänd anslutning + share_mood får läsa
CREATE POLICY "Doctors can view connected user pattern profile"
  ON public.user_pattern_profile
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patient_doctor_connections
    WHERE patient_id = user_pattern_profile.user_id
      AND doctor_id = auth.uid()
      AND status = 'approved'
      AND share_mood = true
  ));

-- Anhöriga med godkänd anslutning + share_mood får läsa
CREATE POLICY "Relatives can view connected user pattern profile"
  ON public.user_pattern_profile
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patient_relative_connections
    WHERE patient_id = user_pattern_profile.user_id
      AND relative_id = auth.uid()
      AND status = 'approved'
      AND share_mood = true
  ));

-- Auto-uppdatera updated_at
CREATE TRIGGER update_user_pattern_profile_updated_at
  BEFORE UPDATE ON public.user_pattern_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_pattern_profile_user_id ON public.user_pattern_profile(user_id);