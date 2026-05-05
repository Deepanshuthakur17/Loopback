-- Add image_url to feedback
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create feedback_images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback_images', 'feedback_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Feedback images are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback_images');

CREATE POLICY "Authenticated users can upload feedback images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback_images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own feedback images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'feedback_images' AND (auth.uid())::text = (storage.foldername(name))[1]);
