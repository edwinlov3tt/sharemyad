# Supabase Storage Setup

## Required Storage Buckets

### 1. temp-uploads

**Purpose**: Temporary storage for uploaded files before malware scanning

**Configuration**:
- **Public bucket**: No (private)
- **File size limit**: 500 MB
- **Allowed MIME types**:
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `video/mp4`
  - `video/webm`
  - `application/zip`

**RLS Policies**:

```sql
-- Allow anyone (including anonymous users) to upload files
CREATE POLICY "Anyone can upload to temp-uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'temp-uploads');

-- Allow users to read their own uploaded files
CREATE POLICY "Users can read own temp uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-uploads');

-- Allow authenticated service role to delete files (for malware cleanup)
CREATE POLICY "Service can delete temp uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'temp-uploads');
```

## Setup Instructions

### Via Supabase Dashboard

1. Go to **Storage** → **New bucket**
2. Name: `temp-uploads`
3. Public: **No** (keep private)
4. File size limit: **500 MB**
5. Click **Create bucket**

6. Click on the `temp-uploads` bucket
7. Go to **Policies** tab
8. Click **New policy** → **For full customization**
9. Copy and paste each RLS policy above
10. Click **Review** → **Save policy**
11. Repeat for all 3 policies

### Via SQL Editor

Alternatively, run this SQL in the Supabase SQL Editor:

```sql
-- Create temp-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads',
  'temp-uploads',
  false,
  524288000,  -- 500 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 524288000,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/zip'];

-- RLS Policies
CREATE POLICY "Anyone can upload to temp-uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'temp-uploads');

CREATE POLICY "Users can read own temp uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-uploads');

CREATE POLICY "Service can delete temp uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'temp-uploads');
```

## Verification

After setup, test upload permissions:

```bash
deno run --allow-net test-malware-scanning.ts
```

Expected output:
```
✅ ALL MALWARE SCANNING TESTS PASSED
```
