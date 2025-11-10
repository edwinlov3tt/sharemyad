-- Create temp-uploads storage bucket for MVP
-- Run this in Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false, -- Keep private
  524288000, -- 500MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip', 'text/html']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous uploads to temp-uploads bucket (for MVP)
CREATE POLICY IF NOT EXISTS "Allow anonymous uploads to temp-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'temp-uploads');

CREATE POLICY IF NOT EXISTS "Allow anonymous reads from temp-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'temp-uploads');

CREATE POLICY IF NOT EXISTS "Allow anonymous deletes from temp-uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'temp-uploads');

-- Verification
SELECT
  '✅ Storage bucket created!' as status,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'temp-uploads';
