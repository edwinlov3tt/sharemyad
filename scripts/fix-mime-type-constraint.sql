-- Fix MIME type constraint to include application/zip
-- Run this in Supabase SQL Editor if you're getting 400 errors on creative_assets

-- Drop the old constraint
ALTER TABLE creative_assets DROP CONSTRAINT IF EXISTS valid_mime_type;

-- Add updated constraint with application/zip
ALTER TABLE creative_assets ADD CONSTRAINT valid_mime_type
  CHECK (mime_type IN (
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/webm',
    'text/html',
    'application/zip'
  ));

-- Verify the change
SELECT
  'MIME type constraint updated' as status,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'creative_assets'::regclass
  AND conname = 'valid_mime_type';
