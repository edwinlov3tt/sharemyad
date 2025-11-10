-- Remove foreign key constraint on user_id for MVP (anonymous uploads)
-- Run this in Supabase SQL Editor

-- Drop the foreign key constraint
ALTER TABLE upload_sessions
DROP CONSTRAINT IF EXISTS upload_sessions_user_id_fkey;

-- Make user_id optional (allow NULL or any UUID)
-- No need to validate against auth.users for MVP

SELECT 'Foreign key constraint removed - anonymous uploads now allowed' as status;

-- Verify
SELECT
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'upload_sessions'
  AND constraint_type = 'FOREIGN KEY';
