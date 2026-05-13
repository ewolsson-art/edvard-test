
-- 1. KRITISK FIX: Förhindra läkare från att ändra delningsfält
CREATE OR REPLACE FUNCTION public.prevent_doctor_modifying_share_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Om läkaren utför uppdateringen, blockera ändringar av delningsfält
  IF auth.uid() = NEW.doctor_id AND auth.uid() <> NEW.patient_id THEN
    IF NEW.share_mood IS DISTINCT FROM OLD.share_mood
       OR NEW.share_sleep IS DISTINCT FROM OLD.share_sleep
       OR NEW.share_eating IS DISTINCT FROM OLD.share_eating
       OR NEW.share_exercise IS DISTINCT FROM OLD.share_exercise
       OR NEW.share_medication IS DISTINCT FROM OLD.share_medication
       OR NEW.share_comments IS DISTINCT FROM OLD.share_comments
       OR NEW.share_ai_insights IS DISTINCT FROM OLD.share_ai_insights
       OR NEW.chat_enabled IS DISTINCT FROM OLD.chat_enabled
       OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
       OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id
       OR NEW.initiated_by IS DISTINCT FROM OLD.initiated_by THEN
      RAISE EXCEPTION 'Doctors cannot modify sharing settings or ownership fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_doctor_share_flag_changes ON public.patient_doctor_connections;
CREATE TRIGGER prevent_doctor_share_flag_changes
  BEFORE UPDATE ON public.patient_doctor_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_doctor_modifying_share_flags();

-- Ersätt den buggiga policyn med en enkel "läkare kan uppdatera sin egen koppling"
-- Skydd för delningsfält hanteras nu av triggern ovan
DROP POLICY IF EXISTS "Doctors can update connection status only" ON public.patient_doctor_connections;
CREATE POLICY "Doctors can update connection status"
  ON public.patient_doctor_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- 2. Gör avatars-bucket privat
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Storage policies för avatars: inloggade kan läsa, ägare kan skriva
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Lägg till saknad UPDATE-policy för forum-images
DROP POLICY IF EXISTS "Users can update their own forum images" ON storage.objects;
CREATE POLICY "Users can update their own forum images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);
