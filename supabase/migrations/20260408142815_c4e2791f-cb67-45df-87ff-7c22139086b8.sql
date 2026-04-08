-- Add image_url column to community_posts
ALTER TABLE public.community_posts
ADD COLUMN image_url text DEFAULT NULL;

-- Create storage bucket for forum images
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true);

-- Allow public read access to forum images
CREATE POLICY "Forum images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-images');

-- Allow authenticated users to upload forum images
CREATE POLICY "Authenticated users can upload forum images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own forum images
CREATE POLICY "Users can delete their own forum images"
ON storage.objects FOR DELETE
USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);